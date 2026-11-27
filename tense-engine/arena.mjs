import {practiceVerbs, tiers, rank, matches, nextItem} from './practice.mjs';

function el(tag,cls,text){
 const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;
}
function button(label,handler,cls='arenaBtn'){
 const n=el('button',cls,label);n.type='button';n.onclick=handler;return n;
}
const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const polygon='polygon('+Array.from({length:14},(_,k)=>[[0,.80],[.15,.80],[.22,1],[.58,1],[.67,.80]].map(([f,r])=>{
 const a=(k+f)*2*Math.PI/14;return (50+49*r*Math.cos(a)).toFixed(2)+'% '+(50+49*r*Math.sin(a)).toFixed(2)+'%';
}).join(',')).join(',')+')';

class ArenaStation extends HTMLElement{
 connectedCallback(){
  if(this.firstChild)return;
  const invite=el('section','arenaInvite'),info=el('div');info.append(el('h2','','Training arena'),el('p','','Choose a verb gear and practice its past tense.'));
  invite.append(info,button('Enter training arena',()=>this.openArena(),'primary'));this.append(invite);
 }
 disconnectedCallback(){this.clearScene();this.dialog?.remove();this.dialog=null}
 clearScene(){this.stop?.();this.stop=null}
 async openArena(){
  if(this.dialog?.open)return;
  const dlg=el('dialog','arenaDialog');this.dialog=dlg;dlg.setAttribute('aria-label','Past tense training arena');
  document.body.append(dlg);dlg.onclose=()=>{this.clearScene();dlg.remove();this.dialog=null;this.querySelector('button')?.focus()};
  this.paused=motion();this.stats={};dlg.showModal();this.loadStats(dlg);
 }
 async loadStats(dlg){
  dlg.replaceChildren();const card=el('div','drill');card.append(el('p','','Loading your gears…'),button('Close',()=>dlg.close()));dlg.append(card);
  try{const data=await this.api('home',{arena:'load'});if(this.dialog!==dlg)return;this.stats=data.stats;this.field()}
  catch(e){if(this.dialog!==dlg)return;card.firstChild.textContent=e.message;card.prepend(button('Try again',()=>this.loadStats(dlg)))}
 }
 top(title,sub,actions){
  const head=el('div','arenaTop'),info=el('div'),buttons=el('div','arenaBtns');
  info.append(el('h2','',title),el('p','',sub));buttons.append(...actions,button('Close',()=>this.dialog?.close()));head.append(info,buttons);return head;
 }
 field(){
  this.clearScene();const dlg=this.dialog;if(!dlg)return;dlg.replaceChildren();
  let paused=this.paused,frame=0,last=0,points=[],W=0,H=0,D=0;
  const toggle=button(paused?'Resume motion':'Pause motion',()=>{
   this.paused=paused=!paused;toggle.textContent=paused?'Resume motion':'Pause motion';field.classList.toggle('still',paused);
  });
  const head=this.top('Training arena','Choose a gear. Its glow shows your average time for your last 7 tries.',[toggle]);
  const scroll=el('div','arenaScroll'),field=el('div','gearField'+(paused?' still':''));scroll.append(field);field.style.setProperty('--gear-cut',polygon);
  field.style.setProperty('--arena-photo','url("'+new URL('./engine.webp',document.baseURI).href+'")');
  field.append(el('div','arenaBackdrop'),el('div','arenaPipes'));const legend=el('div','arenaLegend');
  const labels=['Red · over 26 s','Orange · ≤26 s','Yellow · ≤18 s','Blue · ≤12 s','Green · ≤8 s','Gold · ≤5 s','Purple · ≤3 s'];
  [...tiers].reverse().forEach((t,i)=>{const n=el('span','',labels[i]);n.style.setProperty('--glow',t[2]);legend.append(n)});
  const neutral=el('span','','Gray · new');neutral.style.setProperty('--glow','#9daaa5');legend.append(neutral);
  dlg.append(head,scroll,legend);
  for(const [i,verb] of practiceVerbs.entries()){
   const score=rank(this.stats[verb]?.times);const n=button(verb,()=>this.drill(verb),'verbGear');
   n.style.setProperty('--glow',score.color);n.style.setProperty('--phase',-i*3+'s');
   n.title=verb+' · '+score.name+(score.mean===null?'':' · '+score.mean.toFixed(1)+' s');
   n.setAttribute('aria-label',n.title+', practice');field.append(n);
   const angle=Math.random()*Math.PI*2,p={n,x:0,y:0,vx:11*Math.cos(angle),vy:11*Math.sin(angle),hover:false};
   n.onpointerenter=e=>{p.hover=e.pointerType==='mouse'};n.onpointerleave=()=>{p.hover=false};points.push(p);
  }
  const draw=p=>p.n.style.transform='translate('+p.x.toFixed(2)+'px,'+p.y.toFixed(2)+'px)';
  function resize(){
   const width=Math.floor(scroll.getBoundingClientRect().width);if(!width||W===width)return;W=width;
   const columns=Math.max(3,Math.min(11,Math.floor(W/95))),rows=Math.ceil(points.length/columns);
   const cell=W/columns;D=Math.min(87,cell*.77);
   const rowH=Math.max(D+14,Math.min(110,(window.innerHeight*.68)/rows));H=Math.ceil(rows*rowH+12);
   field.style.height=H+'px';points.forEach((p,i)=>{p.x=(i%columns+.5)*cell-D/2;p.y=(Math.floor(i/columns)+.5)*rowH-D/2+6;p.n.style.width=D+'px';p.n.style.height=D+'px';draw(p)});
  }
  function move(time){
   const dt=Math.min((time-last)/1000,.05);last=time;
   if(!paused&&!document.hidden&&W){
    const fixed=p=>p.hover||p.n===document.activeElement;
    for(const p of points){if(!fixed(p)){p.x+=p.vx*dt;p.y+=p.vy*dt}}
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
     const a=points[i],b=points[j],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy);
     if(dist>=D||dist<.0001)continue;
     const nx=dx/dist,ny=dy/dist,fa=fixed(a),fb=fixed(b),mass=Number(!fa)+Number(!fb);if(!mass)continue;
     const push=(D-dist)/mass,closing=((fa?0:a.vx)-(fb?0:b.vx))*nx+((fa?0:a.vy)-(fb?0:b.vy))*ny;
     const impulse=Math.max(0,closing)*2/mass;
     if(!fa){a.x-=push*nx;a.y-=push*ny;a.vx-=impulse*nx;a.vy-=impulse*ny}
     if(!fb){b.x+=push*nx;b.y+=push*ny;b.vx+=impulse*nx;b.vy+=impulse*ny}
    }
    for(const p of points){
     if(p.x<0)p.vx=Math.abs(p.vx);if(p.x>W-D)p.vx=-Math.abs(p.vx);
     if(p.y<0)p.vy=Math.abs(p.vy);if(p.y>H-D)p.vy=-Math.abs(p.vy);
     p.x=Math.max(0,Math.min(W-D,p.x));p.y=Math.max(0,Math.min(H-D,p.y));draw(p);
    }
   }
   frame=requestAnimationFrame(move);
  }
  const parallax=(x,y)=>{if(paused||motion())return;for(const [layer,scale] of [['far',5],['near',12]]){field.style.setProperty('--'+layer+'-x',x*scale+'px');field.style.setProperty('--'+layer+'-y',y*scale+'px')}};
  field.onpointermove=e=>{const r=field.getBoundingClientRect();parallax((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5)};
  dlg.onscroll=()=>parallax(0,Math.sin(dlg.scrollTop/200)*.6);
  const ro=new ResizeObserver(resize);ro.observe(scroll);resize();frame=requestAnimationFrame(move);
  this.stop=()=>{cancelAnimationFrame(frame);ro.disconnect();dlg.onscroll=null};dlg.scrollTop=0;
 }
 drill(verb){
  this.clearScene();const dlg=this.dialog;if(!dlg)return;dlg.replaceChildren();
  const recent=this.stats[verb]||{times:[],seen:[]},item=nextItem(verb,recent.seen),score=rank(recent.times);
  const head=this.top(verb,'Fill the gap to put the sentence in the past.',[button('All gears',()=>this.field())]);
  const card=el('form','drill'),stat=el('p','drillScore',score.mean===null?'First try':score.name+' gear · '+score.mean.toFixed(1)+' seconds on average · '+recent.times.length+' of 7 tries');stat.style.color=score.color;
  const cue=el('blockquote','',item.now),gap=el('blockquote','',item.gap),label=el('label','','Type the missing word or words.'),input=el('input');
  label.htmlFor='arena-input';input.id=label.htmlFor;input.required=true;input.maxLength=80;input.autocomplete='off';input.spellcheck=false;
  const feedback=el('p');feedback.setAttribute('role','status');const submit=el('button','primary','Check answer');
  card.append(stat,el('strong','','Present'),cue,el('strong','','Past'),gap,label,input,feedback,submit);
  dlg.append(head,card);dlg.scrollTop=0;input.focus({preventScroll:true});
  const uid=crypto.randomUUID();let running=null,elapsed=0,saving=false,solved=false;
  const sync=()=>{const now=performance.now();if(running!==null)elapsed+=now-running;running=document.hidden||solved?null:now};
  sync();document.addEventListener('visibilitychange',sync);this.stop=()=>document.removeEventListener('visibilitychange',sync);
  card.onsubmit=async e=>{
   e.preventDefault();if(saving||!input.value.trim())return;
   if(!matches(input.value,item.answers)){feedback.textContent='Try again. '+(item.id.endsWith('-p')?'Use was or were and the -ing word.':verb==='can'?'Use could or could not, then the base verb if the gap needs it.':item.id.endsWith('-n')&&verb!=='be'?'Use did not and the base verb.':'Look at the subject and the past form.');input.select();return}
   solved=true;sync();saving=true;submit.disabled=true;input.readOnly=true;submit.textContent='Saving…';
   try{
    const data=await this.api('home',{arena:'save',uid,item:item.id,verb,answer:input.value,ms:Math.round(elapsed)});
    this.stats=data.stats;if(this.dialog!==dlg||!card.isConnected)return;
    const next=rank(this.stats[verb].times);feedback.textContent='Correct! '+(elapsed/1000).toFixed(1)+' s this try.';
    stat.textContent=next.name+' gear · '+next.mean.toFixed(1)+' seconds on average · '+this.stats[verb].times.length+' of 7 tries';stat.style.color=next.color;
    submit.replaceWith(button('Next question',()=>this.drill(verb),'primary'));card.onsubmit=event=>event.preventDefault();card.lastChild.focus();
   }catch(err){if(card.isConnected){feedback.textContent=err.message;submit.textContent='Retry save';submit.disabled=false}}
   finally{saving=false}
  };
 }
}
if(!customElements.get('arena-station'))customElements.define('arena-station',ArenaStation);
