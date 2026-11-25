// All positions are viewport coordinates measured on the tilted manuscript.
// Anchor the feather to its real nib, so changing its tilt never moves the ink.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let pen, travel, fade;

export function dismissQuill() {
  travel?.cancel();
  fade?.cancel();
  pen?.remove();
  pen=travel=fade=null;
}

export function writeWithQuill(strokes, typing=false, startTime=null) {
  if(!strokes.length || reduced.matches || !document.documentElement.animate)return;
  const first=strokes[0], last=strokes.at(-1), start=first.box;
  const previous=pen?.getBoundingClientRect();
  const wasVisible=pen && Number(getComputedStyle(pen).opacity)>.3;
  const carry=typing && wasVisible && Math.abs(previous.top-start.top)<start.height*2;
  if(!pen) {
    pen=document.createElement('span');
    pen.className='writing-quill';
    pen.innerHTML='<i class="nib-glint"></i><img class="quill-plume" src="./art/enchanted/writing-quill.webp" alt="">';
    document.querySelector('#flight').append(pen);
  }
  travel?.cancel();fade?.cancel();
  const plume=pen.lastElementChild;
  plume.classList.toggle('leans-left',start.left>innerWidth-95);
  const end=last.landing+last.stroke;
  const total=end+(typing?340:270);
  const frames=[];
  const pose=(time,x,y,angle)=>{
    frames.push({offset:time/total,transform:'translate3d('+x+'px,'+y+'px,0) rotate('+angle+'deg)'});
  };
  const baseline=box=>box.top+box.height*.72;
  const firstY=baseline(start);
  pose(0,carry?previous.left:start.left+9,carry?previous.top:firstY-12,-5);
  let prior=null;
  for(const {box,char,landing,stroke} of strokes) {
    const x=box.left, y=baseline(box), w=box.width;
    if(prior && landing-prior.end>35) {
      // Lift the nib over a space or back to the margin on a wrapped line.
      pose((landing+prior.end)/2,(prior.x+x)/2,Math.min(y,prior.y)-10,-9);
    }
    const high=/[A-Zbdfhklt]/.test(char)? .40 : .22;
    const drop=/[gjpqy]/.test(char)? .15 : 0;
    pose(landing,x,y-1,-2);
    pose(landing+stroke*.32,x+w*.32,y-box.height*high,-7);
    pose(landing+stroke*.67,x+w*.58,y+box.height*drop,2);
    pose(landing+stroke,x+w,y-1,-1);
    prior={x:x+w,y,end:landing+stroke};
  }
  pose(total,prior.x+7,prior.y-13,-8);
  travel=pen.animate(frames,{duration:total,fill:'forwards'});
  const appear=Math.max(0,first.landing-230);
  fade=pen.animate([
    {opacity:carry?1:0,offset:0},
    {opacity:carry?1:0,offset:appear/total},
    {opacity:1,offset:Math.min(first.landing+35,end)/total},
    {opacity:1,offset:(end+70)/total},
    {opacity:0,offset:1}
  ],{duration:total,fill:'forwards'});
  if(startTime!==null) travel.startTime=fade.startTime=startTime;
  const currentFade=fade;
  currentFade.onfinish=()=>{if(fade===currentFade)dismissQuill()};
}

reduced.addEventListener('change',dismissQuill);
window.addEventListener('resize',dismissQuill);
