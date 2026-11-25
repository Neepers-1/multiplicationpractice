import {classFetch} from './classroom.js';
import {fadeSwap,reveal} from './transitions.js';

const root=document.querySelector('#inbox'), stack=root.querySelector('[data-letters]'), status=root.querySelector('[role="status"]');
const more=root.querySelector('[data-more]'),refresh=root.querySelector('[data-refresh]');
const date=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Bangkok',month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',hour12:true});
let view='class',next=null,serial=0;
const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el};
function letter(item) {
  const article=make('article',undefined,'inbox-letter');
  const header=make('header'), name=make('strong',item.writer), time=make('time',date.format(new Date(item.submittedAt)));
  time.dateTime=item.submittedAt;header.append(name,time);
  const scene=make('section'),response=make('section');
  scene.append(make('span','Scene prompt','overline'),make('h3',item.title),make('p',item.prompt));
  response.append(make('span','Submitted paragraph','overline'),make('p',item.response,'submitted-response'));
  article.append(header,scene,response);return article;
}
async function fetchLetters(append=false) {
  const seq=++serial;
  more.disabled=true;refresh.disabled=true;status.textContent='Opening letters…';
  const params=new URLSearchParams({view,...(append&&next?next:{})});
  try {
    const res=await classFetch('teacher/inbox?'+params,{cache:'no-store',credentials:'same-origin'});
    if(!res.ok)throw Object.assign(Error('Could not load submissions. Use Refresh to try again.'),{status:res.status});
    const page=await res.json();
    if(seq!==serial)return;
    const nodes=page.items.map(letter);
    if(!nodes.length&&!append)nodes.push(make('p',view==='class'?'Student paragraphs will appear here when a writer selects Send to teacher.':'Submissions from the test and teacher accounts appear here.','inbox-empty'));
    const draw=()=>{if(seq!==serial)return;if(append)stack.append(...nodes);else stack.replaceChildren(...nodes)};
    if(append){draw();nodes.forEach(n=>reveal(n))}else fadeSwap(stack,draw);
    next=page.next;more.hidden=!next;status.textContent=page.items.length?'Newest submissions first. Times are in Bangkok.':'';
  }catch(err){
    if(seq!==serial)return;
    if(err.status===401||err.status===403){root.hidden=true;location.reload();return}
    if(!append)stack.replaceChildren();
    status.textContent=err.message;
  }finally{if(seq===serial){more.disabled=false;refresh.disabled=false}}
}
export function openInbox(){
  root.hidden=false;fetchLetters();
}
root.addEventListener('click',event=>{
  const b=event.target.closest('button');
  if(!b)return;
  if(b.dataset.view&&view!==b.dataset.view){
    view=b.dataset.view;next=null;more.hidden=true;
    for(const tab of root.querySelectorAll('[data-view]'))tab.setAttribute('aria-pressed',String(tab===b));
    fetchLetters();
  }else if(b===refresh)fetchLetters();
  else if(b===more)fetchLetters(true);
});
