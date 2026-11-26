import {icon,logo} from './icons.js';
import {request} from './notebook.js';
import {makeStars} from './wall-stars.js';
import {fitNear,rotatingBoxes} from './wall-layout.js';
import {createWallCamera,screens} from './wall-camera.js';

const $=s=>document.querySelector(s);
const wall=$('#wall'), message=$('#message'), connection=$('#connection');
const camera=createWallCamera(wall);
camera.setActive(false);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const lifetime=120000;
const fadeTime=()=>reduced.matches?180:1700;
const labels={sight:'Sight',sound:'Sound',smell:'Smell',taste:'Taste',touch:'Touch',thoughts:'Thoughts',feelings:'Feelings'};
const cards=new Map(), pending=new Set(), lastShown=new Map();
let catalog=[],allowed=false,polling=false,nextArrival=0,generation=0,gotList=false,layoutFrame=0,editEpoch=0;
const session=typeof BroadcastChannel==='function'?new BroadcastChannel('quill-account'):null;
const key=story=>story.id+'@'+story.version;
const perView=()=> (camera.frame.clientWidth>=850?2:1)*(camera.frame.clientHeight>=545 && camera.frame.clientWidth>=410?2:1);
const limit=()=>screens*screens*perView();
const gap=()=>({x:8/Math.max(1,wall.clientWidth),y:8/Math.max(1,wall.clientHeight)});
const tool=(label,action,svg)=>'<button type="button" class="wall-'+action+'" aria-label="'+label+'" title="'+label+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+svg+'</svg></button>';
const pinTool=tool('Pin paragraph','pin','<path d="m8 3 9 3-2 2-1 4 2 4-2 1-5-3-4-1 3-3 2-5zM9 14l-4 7"/>');
const moveTool=tool('Move paragraph','move','<path d="M12 2v20M2 12h20M9 5l3-3 3 3M9 19l3 3 3-3M5 9l-3 3 3 3m14-6 3 3-3 3"/>');
const sizeTool=tool('Resize paragraph','resize','<path d="m5 19 14-14M11 5h8v8M5 11v8h8"/>');
$('#mark').innerHTML=logo;$('.empty-mark').innerHTML=icon('lantern');
for(let i=0;i<32;i++){
  const mote=document.createElement('i');
  mote.style.cssText='left:'+Math.random()*98+'%;top:'+(12+Math.random()*85)+'%;--time:'+(8+Math.random()*14)+'s;--delay:-'+Math.random()*30+'s';
  $('#motes').append(mote);
}

function showMessage(title,detail='',link=false) {
  if(message.dataset.title===title && message.dataset.detail===detail && $('#enter').hidden===!link)return;
  message.dataset.title=title;message.dataset.detail=detail;
  message.querySelector('h2').textContent=title;message.querySelector('p').textContent=detail;
  $('#enter').hidden=!link;message.classList.toggle('quiet',!title);message.setAttribute('aria-hidden',String(!title));
}
function gate(signedIn=false) {
  camera.setActive(false);
  generation++;allowed=false;gotList=false;catalog=[];lastShown.clear();
  cards.clear();pending.clear();wall.replaceChildren();
  showMessage(signedIn?'Open the projector account':'Sign in to the story wall',signedIn?'Sign out here, then sign in as observer.':'Use the observer account to display the class’s shared writing.',!signedIn);
  $('#leave').hidden=!signedIn;$('#fullscreen').hidden=true;connection.textContent='';
}
function position(c,b) {
  if(!b){
    c.hiddenAt??=Date.now();
    c.el.hidden=true;return;
  }
  if(c.hiddenAt!==undefined){
    const hiddenTime=Date.now()-c.hiddenAt;
    c.start+=hiddenTime;delete c.hiddenAt;
  }
  const old=c.box;
  const moved=old && (Math.abs(old.x-b.x)+Math.abs(old.y-b.y)+Math.abs(old.w-b.w)+Math.abs(old.h-b.h)>.002);
  if(moved && !c.leaving && c.el.classList.contains('visible') && !wall.querySelector('.is-moving') && !reduced.matches){
    c.relayoutInk?.cancel();
    c.relayoutInk=c.el.animate([{opacity:.32},{opacity:1}],{duration:290,easing:'ease-out'});
  }
  const resized=c.el.hidden || c.box?.w!==b.w || c.box?.h!==b.h || c.width!==wall.clientWidth || c.height!==wall.clientHeight;
  c.box=b;c.width=wall.clientWidth;c.height=wall.clientHeight;c.el.hidden=false;
  Object.assign(c.el.style,{left:b.x*100+'%',top:b.y*100+'%',width:b.w*100+'%',height:b.h*100+'%'});
  if(resized) {
    c.el.style.setProperty('--ink-size',Math.min(46,Math.max(17,Math.min(b.w*c.width*.070,b.h*c.height*.205)))+'px');
  }
}
function layout() {
  if(!allowed || !wall.clientWidth || !wall.clientHeight)return;
  const all=[...cards.values()];
  const fixed=[];
  for(const c of all.filter(c=>c.leaving || c.pin || c.manual || c.gesture).sort((a,b)=>Number(!!b.pin)-Number(!!a.pin))) {
    const desired=c.gesture?.box || c.pin || c.manual || c.box;
    if(!desired)continue;
    const box=fitNear(desired,fixed,gap()) || fitNear(desired,fixed,{x:0,y:0},true);
    position(c,box);
    if(box)fixed.push(box);
  }
  const auto=all.filter(c=>!c.leaving && !c.pin && !c.manual && !c.gesture);
  const reserved=all.filter(c=>!c.pin && !c.leaving && (c.manual||c.gesture)).length;
  const empty=rotatingBoxes(fixed,wall.clientWidth,wall.clientHeight,Math.max(0,limit()-reserved),screens);
  for(const c of auto) {
    if(!empty.length){position(c,null);continue}
    let best=0;
    if(c.box) {
      const distance=b=>(b.x-c.box.x)**2+(b.y-c.box.y)**2;
      for(let i=1;i<empty.length;i++) if(distance(empty[i])<distance(empty[best]))best=i;
    } else {
      // Keep the first arrivals together in the nearest section of the board.
      const section=b=>Math.floor((b.x+b.w/2)*screens)+screens*Math.floor((b.y+b.h/2)*screens);
      const nearest=Math.min(...empty.map(section));
      const choices=empty.filter(b=>section(b)===nearest);
      best=empty.indexOf(choices[Math.floor(Math.random()*choices.length)]);
    }
    position(c,empty.splice(best,1)[0]);
  }
}
function queueLayout(){
  if(!layoutFrame)layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;layout()});
}
new ResizeObserver(queueLayout).observe(wall);
function retire(c) {
  if(c.leaving)return;
  c.leaving=true;c.gesture=null;c.el.classList.remove('visible');c.el.classList.add('leaving');
  c.el.inert=true;
  setTimeout(()=>{if(cards.get(c.id)===c){cards.delete(c.id);c.el.remove();layout();tick()}},fadeTime());
}
function paintPin(c) {
  const button=c.el.querySelector('.wall-pin');
  const label=c.pin?'Unpin paragraph':'Pin paragraph';
  button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(!!c.pin));
  c.el.classList.toggle('is-pinned',!!c.pin);
}
function applyState(c,state) {
  const wasPinned=!!c.pin;
  c.rating=state.rating;c.pin=state.pin;c.stars.set(c.rating);paintPin(c);
  if(wasPinned && !c.pin) {c.start=Date.now();c.manual=null}
  if(c.pin)c.manual=null;
}
function save(c, patch) {
  editEpoch++;c.saving++;
  applyState(c,{rating:c.rating,pin:c.pin,...patch});layout();
  c.writes=c.writes.then(async()=>{
    if(!allowed||cards.get(c.id)!==c)return;
    const saved=await request('projector/'+c.id,'PUT',{version:c.version,...patch});
    c.confirmed=saved;
    const entry=catalog.find(item=>key(item)===c.key);
    if(entry)Object.assign(entry,saved);
  }).catch(e=>{
    if(cards.get(c.id)!==c)return;
    if(e.status===401||e.status===403)gate(e.status===403);
    else if(e.status===409) {retire(c);void refresh()}
    else connection.textContent='That wall change could not be saved. Try it again.';
  }).finally(()=>{
    c.saving--;editEpoch++;
    if(!c.saving && cards.get(c.id)===c && !c.leaving && !c.gesture){applyState(c,c.confirmed);layout();tick()}
  });
}

function adjust(c,original,dx,dy,resizing) {
  const minW=Math.min(.94,170/wall.clientWidth),minH=Math.min(.9,106/wall.clientHeight);
  const candidate=resizing?{...original,w:Math.min(1-original.x,Math.max(minW,original.w+dx)),h:Math.min(1-original.y,Math.max(minH,original.h+dy))}:
    {...original,x:Math.min(1-original.w,Math.max(0,original.x+dx)),y:Math.min(1-original.h,Math.max(0,original.y+dy))};
  const fixed=[...cards.values()].filter(s=>s!==c && !s.el.hidden && (s.pin||s.manual||s.leaving)).map(s=>s.box).filter(Boolean);
  const result=fitNear(candidate,fixed,gap(),resizing);
  return result && result.w>=Math.min(minW,original.w)-.001 && result.h>=Math.min(minH,original.h)-.001 ? result : (c.gesture?.box || original);
}
function commitBox(c,box) {
  c.gesture=null;c.el.classList.remove('is-moving');
  if(c.pin)save(c,{pin:box});
  else {c.manual=box;c.start=Date.now();layout()}
}
function addHandles(c) {
  function begin(e){
    if(e.button!==0||c.leaving||c.gesture||!c.box)return;
    if(e.target.closest('.window'))return;
    const button=e.target.closest('button');
    const resizing=!!e.target.closest('.wall-resize');
    if(button && !resizing && !button.classList.contains('wall-move'))return;
    e.preventDefault();
    const origin={...c.box},x=e.clientX,y=e.clientY;
    const startBounds=wall.getBoundingClientRect();
    let pointerX=x,pointerY=y,moving=false,edgeFrame=0,previousTime=0;
    function draggedBox(){
      const bounds=wall.getBoundingClientRect();
      const dx=pointerX-x+startBounds.left-bounds.left;
      const dy=pointerY-y+startBounds.top-bounds.top;
      return adjust(c,origin,dx/wall.clientWidth,dy/wall.clientHeight,resizing);
    }
    function followEdge(time){
      edgeFrame=0;
      if(!moving || !c.gesture || !c.el.isConnected)return;
      const view=camera.frame.getBoundingClientRect();
      const speed=(p,lo,hi)=>p<lo+30 ? -Math.min(1,(lo+30-p)/30) : Math.max(0,Math.min(1,(p-hi+30)/30));
      const elapsed=Math.min(32,time-previousTime || 16);
      previousTime=time;
      const dx=speed(pointerX,view.left,view.right), dy=speed(pointerY,view.top,view.bottom);
      if(!dx && !dy)return;
      camera.pan(dx*elapsed*.65,dy*elapsed*.65);
      c.gesture.box=draggedBox();queueLayout();
      edgeFrame=requestAnimationFrame(followEdge);
    }
    const el=c.el, id=e.pointerId;
    c.gesture={box:origin};el.classList.add('is-moving');el.setPointerCapture(id);
    function move(event){
      if(event.pointerId!==id || !c.gesture)return;
      pointerX=event.clientX;pointerY=event.clientY;
      moving ||= Math.abs(pointerX-x)+Math.abs(pointerY-y)>2;
      if(!moving)return;
      c.gesture.box=draggedBox();queueLayout();
      if(!edgeFrame)edgeFrame=requestAnimationFrame(followEdge);
    }
    function end(event){
      if(event.pointerId!==id)return;
      cancelAnimationFrame(edgeFrame);
      el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',end);el.removeEventListener('lostpointercapture',cancel);
      if(el.hasPointerCapture(id))el.releasePointerCapture(id);
      if(!c.gesture)return;
      if(event.type==='pointerup' && moving) {
        pointerX=event.clientX;pointerY=event.clientY;
        commitBox(c,draggedBox());
      } else {c.gesture=null;el.classList.remove('is-moving');layout()}
    }
    function cancel(event){end(event)}
    el.addEventListener('pointermove',move);el.addEventListener('pointerup',end);el.addEventListener('lostpointercapture',cancel);
  }
  c.el.addEventListener('pointerdown',begin);
  for(const action of ['move','resize']) {
    const handle=c.el.querySelector('.wall-'+action);
    handle.title=(action==='move'?'Move':'Resize')+' paragraph · drag or use arrow keys';
    handle.addEventListener('keydown',e=>{
      const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
      if(!direction || c.leaving || !c.box)return;
      e.preventDefault();const pixels=e.shiftKey?32:12;
      commitBox(c,adjust(c,c.box,direction[0]*pixels/wall.clientWidth,direction[1]*pixels/wall.clientHeight,action==='resize'));
    });
  }
}
function mount(story) {
  const el=document.createElement('article');el.className='story';
  el.innerHTML='<div class="wall-tools">'+pinTool+moveTool+'</div><div class="byline"><span class="author"></span><span class="senses"></span></div><blockquote><span class="quotesign open" aria-hidden="true">“</span><div class="window" role="region" tabindex="0"><div class="ink"></div></div><span class="quotesign close" aria-hidden="true">”</span></blockquote>'+sizeTool;
  el.querySelector('.author').textContent=story.username;
  for(const id of story.lenses.filter(id=>Object.hasOwn(labels,id))){
    const badge=document.createElement('span');badge.innerHTML=icon(id);badge.title=labels[id];badge.setAttribute('role','img');badge.setAttribute('aria-label',labels[id]);el.querySelector('.senses').append(badge);
  }
  const viewport=el.querySelector('.window');
  viewport.setAttribute('aria-label', 'Paragraph by '+story.username);
  viewport.querySelector('.ink').textContent=story.response;
  const now=Date.now(),k=key(story);
  const c={el,id:story.id,key:k,version:story.version,start:now+fadeTime(),pin:story.pin,rating:story.rating,confirmed:{pin:story.pin,rating:story.rating},writes:Promise.resolve(),saving:0};
  c.stars=makeStars(story.username,c.rating,rating=>save(c,{rating}));
  el.querySelector('.wall-tools').prepend(c.stars.element);
  el.querySelector('.wall-pin').onclick=()=>{if(c.box && !c.leaving)save(c,{pin:c.pin?null:{...c.box}})};
  addHandles(c);paintPin(c);cards.set(c.id,c);wall.append(el);layout();lastShown.set(k,now);
  viewport.addEventListener('scroll',()=>{if(!c.pin)c.start=Date.now()}, {passive:true});
  el.getBoundingClientRect();el.classList.add('visible');
}
async function bring(entry){
  const gen=generation,k=key(entry);pending.add(k);
  try{
    const story=await request('projector/'+entry.id);
    if(gen===generation && allowed && !cards.has(entry.id) && key(story)===k && catalog.some(s=>key(s)===k))mount(story);
  }catch(e){
    if(gen!==generation)return;
    if(e.status===401||e.status===403)gate(e.status===403);
    else if(e.status===404)catalog=catalog.filter(s=>key(s)!==k);
    else connection.textContent='Reconnecting to the story wall…';
  }finally{if(gen===generation)pending.delete(k)}
}
function tick(){
  if(!allowed||!gotList||document.hidden)return;
  const now=Date.now(),playing=[];
  for(const c of cards.values()){
    if(c.leaving)continue;
    if(!catalog.some(item=>key(item)===c.key)){retire(c);continue}
    if(!c.pin && !c.el.hidden && !c.saving && !c.gesture && now>=c.start+lifetime){retire(c);continue}
    if(!c.pin)playing.push(c);
  }
  if(playing.length>limit()){
    const extra=playing.filter(c=>!c.gesture && !c.saving).sort((a,b)=>a.start-b.start).slice(0,playing.length-limit());
    extra.forEach(retire);
  }
  if(!catalog.length){if(!cards.size)showMessage('Waiting for the first story','In your journal, choose “Share on projector” to add your paragraph.');return}
  showMessage('');
  const waiting=catalog.filter(s=>!cards.has(s.id) && !pending.has(key(s)));
  const pinned=waiting.filter(s=>s.pin);
  if(pinned.length){pinned.forEach(bring);return}
  if(now<nextArrival || playing.length+pending.size>=limit())return;
  const choices=waiting.map(story=>({story,when:lastShown.get(key(story))||0,tie:Math.random()})).sort((a,b)=>a.when-b.when||a.tie-b.tie);
  if(choices.length){nextArrival=now+550;void bring(choices[0].story)}
}
async function refresh() {
  if(!allowed||polling)return;
  const gen=generation,epoch=editEpoch;polling=true;
  try {
    const result=await request('projector');
    if(gen!==generation || epoch!==editEpoch)return;
    catalog=result.stories;gotList=true;connection.textContent='';
    const live=new Set(catalog.map(key));
    for(const id of lastShown.keys())if(!live.has(id))lastShown.delete(id);
    for(const entry of catalog){
      const c=cards.get(entry.id);
      if(c && c.key===key(entry) && !c.saving && !c.gesture){
        c.confirmed={pin:entry.pin,rating:entry.rating};applyState(c,c.confirmed);
      }
    }
    layout();tick();
  }catch(e){
    if(gen!==generation)return;
    if(e.status===401||e.status===403)gate(e.status===403);
    else connection.textContent='Reconnecting to the story wall…';
  }finally{polling=false}
}
async function openWall() {
  try{
    const {user}=await request('me');
    if(!['observer','admin'].includes(user?.role)){gate(Boolean(user));return}
    allowed=true;camera.setActive(true);$('#leave').hidden=false;$('#fullscreen').hidden=!document.fullscreenEnabled;
    await document.fonts.ready;layout();await refresh();
  }catch{showMessage('Connecting to the story wall…','The display will try again.');setTimeout(openWall,6000)}
}
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('#connection').textContent='Full screen is unavailable in this window.'}};
document.addEventListener('fullscreenchange',()=>{const label=document.fullscreenElement?'Exit full screen':'Full screen';$('#fullscreen').title=label;$('#fullscreen').setAttribute('aria-label',label)});
$('#leave').onclick=async()=>{try{await request('logout','POST',{});session?.postMessage('signed-out');gate()}catch{$('#connection').textContent='Could not sign out. Try again.'}};
session?.addEventListener('message',()=>{gate();openWall()});
window.addEventListener('pageshow',e=>{if(e.persisted){gate();openWall()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refresh();tick()}});
setInterval(tick,350);setInterval(refresh,6500);
openWall();
