// Work in fractions of the wall so a pinned composition survives full screen and reloads.
const whole = {x:0,y:0,w:1,h:1};
const right = r => r.x+r.w;
const bottom = r => r.y+r.h;
const clamp = (n,lo,hi) => Math.max(lo,Math.min(n,hi));
const epsilon = .000001;

function subtract(areas, occupied) {
  const next = [];
  for (const a of areas) {
    if (a.x >= right(occupied) || right(a) <= occupied.x || a.y >= bottom(occupied) || bottom(a) <= occupied.y) {
      next.push(a); continue;
    }
    if (occupied.x > a.x) next.push({...a,w:occupied.x-a.x});
    if (right(occupied) < right(a)) next.push({...a,x:right(occupied),w:right(a)-right(occupied)});
    if (occupied.y > a.y) next.push({...a,h:occupied.y-a.y});
    if (bottom(occupied) < bottom(a)) next.push({...a,y:bottom(occupied),h:bottom(a)-bottom(occupied)});
  }
  return next.filter((a,i)=>a.w>epsilon && a.h>epsilon && !next.some((b,j)=>
    i!==j && a.x>=b.x && a.y>=b.y && right(a)<=right(b) && bottom(a)<=bottom(b) &&
    (a.w<b.w || a.h<b.h || j<i)));
}

function freeAreas(fixed, gap) {
  return fixed.reduce((areas,r)=>subtract(areas,{x:r.x-gap.x,y:r.y-gap.y,w:r.w+2*gap.x,h:r.h+2*gap.y}),[whole]);
}

export function fitNear(box, fixed, gap, resizing=false) {
  const candidates = [];
  for (const a of freeAreas(fixed,gap)) {
    if (!resizing && (box.w>a.w+epsilon || box.h>a.h+epsilon)) continue;
    const w=Math.min(a.w,box.w), h=Math.min(a.h,box.h);
    const x=clamp(box.x,a.x,right(a)-w),y=clamp(box.y,a.y,bottom(a)-h);
    const distance=(x-box.x)**2+(y-box.y)**2;
    const sizeLoss=(box.w-w)**2+(box.h-h)**2;
    candidates.push({box:{x,y,w,h},score:resizing?distance*10+sizeLoss:distance});
  }
  return candidates.sort((a,b)=>a.score-b.score)[0]?.box;
}

export function rotatingBoxes(fixed,width,height,count,screens=1) {
  if (!count || !width || !height) return [];
  const gap={x:16/width,y:16/height};
  const available=freeAreas(fixed,gap);
  const viewWidth=width/screens, viewHeight=height/screens;
  const cols=screens*(viewWidth>=850?2:1);
  const rows=screens*(viewHeight>=545 && viewWidth>=410?2:1);
  const baseW=1/cols-.028/screens, baseH=1/rows-.035/screens;
  const section=area=>Math.floor((area.y+.02/screens)*screens)*screens+Math.floor((area.x+.02/screens)*screens);
  let best=[];
  for (let i=0;i<=25;i++) {
    const scale=1-i*.029;
    const w=baseW*scale, h=baseH*scale;
    if (w*width < Math.min(180,width*.72) || h*height < Math.min(104,height*.45)) break;
    let areas=available, boxes=[];
    for (let n=0;n<count;n++) {
      const fits=areas.filter(a=>a.w>=w && a.h>=h)
        .sort((a,b)=>section(a)-section(b) || a.y-b.y || a.x-b.x);
      if (!fits.length) break;
      const a=fits[0], box={x:a.x,y:a.y,w,h};
      boxes.push(box);
      areas=subtract(areas,{x:box.x-gap.x,y:box.y-gap.y,w:w+2*gap.x,h:h+2*gap.y});
    }
    if (boxes.length>best.length) best=boxes;
    if (boxes.length===count) break;
  }
  return best;
}
