import {beginQuillWriting} from './quill-sound.js';
import {writeWithQuill,dismissQuill} from './quill.js';

let clearCurrent=null;
export function finishFlight(){clearCurrent?.()}
export function stopInk(){finishFlight();dismissQuill()}

function makeMirror(editor) {
  const mirror=document.createElement('div');
  mirror.className='editor-mirror';
  mirror.setAttribute('aria-hidden','true');
  mirror.style.width=editor.clientWidth+'px';
  mirror.style.height=editor.clientHeight+'px';
  return mirror;
}

export function writeTypedInk(editor,event) {
  if(event.inputType!=='insertText' || !event.data || event.isComposing ||
    matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const char=Array.from(event.data).at(-1);
  if(!char.trim()){dismissQuill();return}
  const end=editor.selectionEnd;
  const mirror=makeMirror(editor), mark=document.createElement('span');
  mirror.style.visibility='hidden';
  mark.textContent=char;
  mirror.append(editor.value.slice(0,end-char.length),mark,editor.value.slice(end)+'\u200b');
  editor.parentElement.append(mirror);mirror.scrollTop=editor.scrollTop;
  const box=mark.getBoundingClientRect(), viewport=editor.getBoundingClientRect();
  mirror.remove();
  if(box.bottom<=viewport.top||box.top>=viewport.bottom){dismissQuill();return}
  writeWithQuill([{box,char,landing:24,stroke:105}],true);
}

export function flyInk(editor,source,phrase,at){
  stopInk();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const node=source.querySelector('.phrase-text')?.firstChild;
  if(!node||node.nodeType!==Node.TEXT_NODE||!editor.animate)return;
  const range=document.createRange();
  const chars=Array.from(phrase), origins=[];
  let index=0;
  for(const char of chars){
    range.setStart(node,index);index+=char.length;range.setEnd(node,index);
    origins.push(range.getBoundingClientRect());
  }
  const editBox=editor.getBoundingClientRect();
  if(editBox.top>innerHeight-70||editBox.bottom<70)editor.scrollIntoView({behavior:'instant',block:'center'});
  const mirror=makeMirror(editor),letters=[];
  mirror.append(editor.value.slice(0,at));
  for(const char of chars){
    const letter=document.createElement('span');letter.className='arriving-letter';letter.textContent=char;
    mirror.append(letter);letters.push(letter);
  }
  mirror.append(editor.value.slice(at+phrase.length)+'\u200b');
  editor.parentElement.append(mirror);editor.classList.add('is-flying');mirror.scrollTop=editor.scrollTop;
  const last=letters.at(-1);
  const excess=last.getBoundingClientRect().bottom-editor.getBoundingClientRect().bottom;
  if(excess>0){editor.scrollTop+=excess+12;mirror.scrollTop=editor.scrollTop}
  const surface=document.querySelector('#flight'),fontSize=parseFloat(getComputedStyle(editor).fontSize);
  const step=reduced?3:Math.min(94,Math.max(60,2100/chars.length));
  const flightTime=reduced?65:565;
  const stroke=reduced?1:step*.90;
  const timers=[],animations=[],particles=[],strokes=[];
  let stopSound=()=>{},previousBox=null,launch=0;
  function later(f,ms){timers.push(setTimeout(f,ms))}
  clearCurrent=()=>{
    clearCurrent=null;stopSound();timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());
    particles.forEach(p=>p.remove());mirror.remove();editor.classList.remove('is-flying');dismissQuill();
    document.removeEventListener('scroll',onScroll,true);window.removeEventListener('resize',stopInk);
  };
  function onScroll(event){if(event.target!==mirror)stopInk()}
  // Give the moving feather, particles and ink the same clock even on a busy device.
  const boxes=letters.map(letter=>letter.getBoundingClientRect());
  const startTime=document.timeline.currentTime;
  letters.forEach((target,i)=>{
    const char=chars[i];
    if(!char.trim()){launch+=step;return}
    const origin=origins[i],box=boxes[i];
    if(!reduced && previousBox && box.top>previousBox.top+fontSize*.6)launch+=155;
    const delay=launch, landing=delay+flightTime-25;
    const sx=Math.min(innerWidth-8,Math.max(8,origin.left)), sy=Math.max(6,Math.min(innerHeight-15,origin.top));
    strokes.push({char,box,landing,stroke});previousBox=box;
    const ink=target.animate([
      {opacity:0,color:'#ae7b35',backgroundSize:'0% 100%'},
      {offset:.55,opacity:1,color:'#91632c',backgroundSize:'55% 100%'},
      {opacity:1,color:'#3b2f24',backgroundSize:'100% 100%'}
    ],{delay:landing,duration:stroke,fill:'both'});
    animations.push(ink);
    if(!reduced){
      const p=document.createElement('span');p.className='flying-letter';p.style.fontSize=fontSize+'px';p.textContent=char;surface.append(p);particles.push(p);
      const x=box.left,y=box.top+(box.height-fontSize)*.48;
      const mx=(sx+x)*.5,my=Math.min(sy,y)-Math.min(94,Math.max(32,Math.abs(x-sx)*.19))-Math.sin(i*.7)*12;
      const transform=(xx,yy,s,r)=>'translate('+xx+'px,'+yy+'px) rotate('+r+'deg) scale('+s+')';
      const a=p.animate([{transform:transform(sx,sy,.7,-6),opacity:0},{offset:.12,opacity:1},{offset:.52,transform:transform(mx,my,1.35,Math.sin(i)*12),color:'#cc9140',opacity:1},{transform:transform(x,y,1,0),opacity:.9}],{delay,duration:flightTime,easing:'cubic-bezier(.35,.07,.49,.99)',fill:'both'});
      animations.push(a);a.onfinish=()=>p.remove();
      if(i%2===0){
        const s=document.createElement('i');s.className='ink-spark';surface.append(s);particles.push(s);
        const glow=s.animate([{transform:'translate('+mx+'px,'+my+'px) scale(.1)',opacity:0},{offset:.38,opacity:.9},{transform:'translate('+(mx+8)+'px,'+(my-11)+'px) scale(.2)',opacity:0}],{delay:delay+235,duration:320,fill:'both'});
        animations.push(glow);glow.onfinish=()=>s.remove();
      }
    }
    launch+=step;
  });
  if(startTime!==null) for(const animation of animations) animation.startTime=startTime;
  if(!reduced)writeWithQuill(strokes,false,startTime);
  stopSound=beginQuillWriting(strokes,reduced);
  // Initial caret scrolling can generate an asynchronous scroll event. Register
  // after layout settles so it doesn't cancel the very flight that caused it.
  later(()=>{document.addEventListener('scroll',onScroll,true);window.addEventListener('resize',stopInk)},80);
  later(stopInk,launch+flightTime+320);
}
