// A camera moves over the wall. Story positions stay in the wall's coordinate system.
export const screens = 2;
const clamp = (n, max) => Math.max(0, Math.min(n, max));

export function createWallCamera(wall) {
  const frame = document.createElement('div');
  frame.className = 'wall-viewport';
  frame.tabIndex = 0;
  frame.setAttribute('role', 'region');
  frame.setAttribute('aria-label', 'Story wall. Drag the background or use arrow keys to explore.');
  wall.before(frame);
  frame.append(wall);

  const background = document.createElement('div');
  background.className = 'wall-background';
  background.setAttribute('aria-hidden', 'true');
  wall.before(background);
  frame.style.setProperty('--wall-span', screens * 100 + '%');
  const map = document.createElement('button');
  map.type = 'button';
  map.className = 'wall-map';
  map.setAttribute('aria-label', 'Choose a spot to zoom in, or press Enter to return to reading');
  map.hidden = true;
  frame.append(map);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = 'Show all';
  toggle.title = 'See the whole wall, then click a spot to read it';
  toggle.setAttribute('aria-pressed', 'false');
  document.querySelector('nav').prepend(toggle);

  const hint = document.createElement('span');
  hint.className = 'wall-hint';
  hint.textContent = 'Drag the background to explore';
  frame.after(hint);

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let x = 0, y = 0, overview = false, active = false, drag = null;
  let current = {x:0,y:0,scale:1}, animation = null;
  const width = () => frame.clientWidth, height = () => frame.clientHeight;
  const transform = point => 'translate('+point.x+'px,'+point.y+'px) scale('+point.scale+')';

  function render(animate = false) {
    x = clamp(x, (screens-1)*width());
    y = clamp(y, (screens-1)*height());
    const next = overview ? {x:0,y:0,scale:1/screens} : {x:-x,y:-y,scale:1};
    const previous = animation ? getComputedStyle(wall).transform : transform(current);
    animation?.cancel();
    animation = null;
    wall.style.transform = transform(next);
    if (animate && !motion.matches) {
      animation = wall.animate([{transform:previous},{transform:transform(next)}],
        {duration:370,easing:'cubic-bezier(.2,.75,.2,1)'});
      animation.onfinish = () => { animation = null; };
    }
    current = next;
  }
  function pan(dx, dy, animate = false) {
    if (!active || overview) return;
    x += dx; y += dy;
    render(animate);
  }
  function setOverview(value, location) {
    if (!active) return;
    if (location) {
      x = location.x*screens - width()/2;
      y = location.y*screens - height()/2;
    }
    overview = value;
    wall.inert = value;
    map.hidden = !value;
    toggle.textContent = value ? 'Reading view' : 'Show all';
    toggle.setAttribute('aria-pressed', String(value));
    hint.textContent = value ? 'Click a spot to read it' : 'Drag the background to explore';
    render(true);
  }
  toggle.onclick = () => setOverview(!overview);
  map.onclick = event => {
    const bounds = frame.getBoundingClientRect();
    let location = null;
    if (event.detail) {
      location = {x:event.clientX-bounds.left,y:event.clientY-bounds.top};
      for (const story of wall.querySelectorAll('.story.visible:not([hidden])')) {
        const box = story.getBoundingClientRect();
        if (event.clientX >= box.left && event.clientX <= box.right &&
            event.clientY >= box.top && event.clientY <= box.bottom) {
          location = {x:box.left+box.width/2-bounds.left,y:box.top+box.height/2-bounds.top};
          break;
        }
      }
    }
    setOverview(false, location);
    frame.focus({preventScroll:true});
  };
  frame.addEventListener('pointerdown', event => {
    if (!active || overview || event.button !== 0 || event.target !== background) return;
    drag = {id:event.pointerId,x:event.clientX,y:event.clientY};
    background.setPointerCapture(event.pointerId);
    background.classList.add('dragging');
    frame.focus({preventScroll:true});
  });
  background.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    pan(drag.x-event.clientX, drag.y-event.clientY);
    drag.x=event.clientX; drag.y=event.clientY;
  });
  background.addEventListener('lostpointercapture', () => {
    drag = null; background.classList.remove('dragging');
  });
  frame.addEventListener('wheel', event => {
    if (!active || overview || event.ctrlKey || event.target.closest('.window')) return;
    const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? height() : 1;
    event.preventDefault();
    const sideways = event.shiftKey && !event.deltaX;
    pan(unit*(sideways ? event.deltaY : event.deltaX), unit*(sideways ? 0 : event.deltaY));
  }, {passive:false});
  frame.addEventListener('keydown', event => {
    if (!active) return;
    if (overview && event.key === 'Escape') {
      event.preventDefault(); setOverview(false); frame.focus({preventScroll:true}); return;
    }
    if (overview || event.target !== frame) return;
    const amount = event.shiftKey ? .8 : .16;
    const move = {ArrowLeft:[-amount,0],ArrowRight:[amount,0],ArrowUp:[0,-amount],ArrowDown:[0,amount]}[event.key];
    if (move) {event.preventDefault();pan(move[0]*width(),move[1]*height(),true);}
  });
  frame.addEventListener('focusin', event => {
    if (!active || overview || !event.target.closest('.story') ||
        !event.target.matches(':focus-visible')) return;
    const box = event.target.getBoundingClientRect(), view = frame.getBoundingClientRect();
    const correction = (low,high,start,end) => low < start ? low-start : Math.max(0,high-end);
    const dx = correction(box.left,box.right,view.left,view.right);
    const dy = correction(box.top,box.bottom,view.top,view.bottom);
    if (dx || dy) pan(dx,dy);
  });
  let oldWidth = width(), oldHeight = height();
  new ResizeObserver(() => {
    const w=width(), h=height();
    if (oldWidth && oldHeight) {x *= w/oldWidth; y *= h/oldHeight;}
    oldWidth=w; oldHeight=h; render();
  }).observe(frame);
  return {
    frame, pan,
    setActive(value) {
      if (!value) {
        overview=false; x=0; y=0; map.hidden=true; wall.inert=false; render();
        toggle.textContent='Show all'; toggle.setAttribute('aria-pressed','false');
        hint.textContent='Drag the background to explore';
      }
      active=value; toggle.hidden=!value; hint.hidden=!value; frame.tabIndex=value?0:-1;
    }
  };
}
