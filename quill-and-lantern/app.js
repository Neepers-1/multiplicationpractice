import {classConnected} from './classroom.js';
import {scenes,lenses} from './content.js';
import {icon,logo} from './icons.js';
import {Notebook,request} from './notebook.js';
import {watchReviews} from './student-reviews.js';
import {flyInk,stopInk,finishFlight,writeTypedInk} from './ink.js';
import {bindJournalMusic} from './journal-music.js';
import {bindQuillSound} from './quill-sound.js';
import {renderScenery,renderSceneryPreview} from './scenery.js';
import {initCandlelight} from './candle.js';
import {fadeSwap, reveal, closeSoftly, turnPage} from './transitions.js';

const $=s=>document.querySelector(s);
const editor=$('#editor'),modal=$('#modal'),byId=new Map(scenes.map(s=>[s.id,s])),lensMap=new Map(lenses.map(l=>[l.id,l]));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tiers=['Basic','Mid-tier','Pro-style'];
const count=text=>(text.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;
const fmt=d=>{const dt=new Date(d);return Number.isNaN(+dt)?'':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'Asia/Bangkok'}).format(dt)};
const isMeaningful=d=>!!(d.text.trim()||d.lenses.length);
const labeled=(n,text)=>icon(n)+'<span>'+escape(text)+'</span>';
let activeLens='',tier=0,shownDoc=null,toastTime,opening=false,hashSeen=null,ready=false,returnTeacher=false,returnWall=false;
const sessionChanges=typeof BroadcastChannel==='function'?new BroadcastChannel('quill-account'):null;
sessionChanges?.addEventListener('message',()=>{if(notebook.doc)notebook.persist();location.reload()});
const notebook=new Notebook(update,notice);
const reviews=watchReviews(notebook,request,()=>{
  if(notebook.doc){status();if(hashSeen==='library')renderShelf()}
});
function notice(message){const n=$('#toast');n.textContent=message;n.classList.add('show');clearTimeout(toastTime);toastTime=setTimeout(()=>n.classList.remove('show'),5100)}
function renderIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.outerHTML=icon(el.dataset.icon))}
renderIcons();$('#brandmark').innerHTML=logo;
bindQuillSound($('#soundToggle'));
bindJournalMusic($('#journalMusic'), $('#musicToggle'));
initCandlelight();
let renderedScene=null, starterKey='', chipKey='', sending=false, sharing=false;
function dialog(html,wide=false){
  delete modal.dataset.closing;
  const body=$('#dialogBody');body.innerHTML=html;modal.classList.toggle('wide',wide);
  if(!modal.open)modal.showModal();else reveal(body);
  modal.scrollTop=0;
}
function closeDialog(){closeSoftly(modal)}
modal.addEventListener('cancel',e=>{e.preventDefault();closeDialog()});
$('#closeModal').onclick=closeDialog;modal.addEventListener('click',e=>{if(e.target===modal){const b=modal.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeDialog()}});
function fitCover(){
  const cover=$('#deskCover'),pic=$('.desk-picture'),target=$('#openJournal');
  if(cover.hidden||!cover.clientWidth)return;
  const w=cover.clientWidth,h=cover.clientHeight,portrait=w/h<.9;
  const scale=portrait?Math.min(h/941,w*2.01/1672):Math.max(w/1672,h/941);
  const iw=1672*scale,ih=941*scale,dx=(w-iw)*.55,dy=(h-ih)*(portrait?.55:.5);
  pic.style.backgroundSize=iw+'px '+ih+'px';pic.style.backgroundPosition=dx+'px '+dy+'px';
  const x=dx+iw*.336,y=dy+ih*.035,bw=iw*.38,bh=ih*.83;
  Object.assign(target.style,{left:x+'px',top:y+'px',width:bw+'px',height:bh+'px'});
  pic.style.transformOrigin=(x+bw*.50)+'px '+(y+bh*.50)+'px';cover.classList.toggle('portrait',portrait);
}
new ResizeObserver(fitCover).observe($('#deskCover'));
function route(){
  stopInk();
  const mode=location.hash==='#my-writing'?'library':location.hash==='#workshop'?'workshop':'desk';
  if(hashSeen===mode&&ready){if(mode==='library')renderShelf();return}
  hashSeen=mode;
  $('#deskCover').hidden=mode!=='desk';$('#workshop').hidden=mode!=='workshop';$('#writingShelf').hidden=mode!=='library';
  document.body.classList.toggle('at-desk',mode==='desk');document.body.classList.toggle('book-open',mode==='workshop');
  $('#navWork').toggleAttribute('aria-current',mode!=='library');if(mode!=='library')$('#navWork').setAttribute('aria-current','page');
  $('#navLibrary').toggleAttribute('aria-current',mode==='library');if(mode==='library')$('#navLibrary').setAttribute('aria-current','page');
  document.title=(mode==='library'?'My writing':mode==='workshop'?'Writing workshop':'The writing journal')+' · Quill & Lantern';
  $('#deskCover').classList.remove('opening');opening=false;window.scrollTo({top:0,behavior:'instant'});
  if(mode==='desk')fitCover();
  if(mode==='workshop'){$('.book-shell').classList.remove('reveal');void $('.book-shell').offsetWidth;$('.book-shell').classList.add('reveal')}
  if(mode==='library'&&ready){renderShelf();notebook.refresh()}
}
window.addEventListener('hashchange',()=>turnPage(route));
function openCover(){if(opening)return;opening=true;$('#deskCover').classList.add('opening');setTimeout(()=>{location.hash='workshop'},matchMedia('(prefers-reduced-motion: reduce)').matches?10:660)}
$('#openJournal').onclick=openCover;$('#navWork').addEventListener('click',e=>{if(hashSeen==='desk'){e.preventDefault();openCover()}});
function palette(){const group=$('#palette');group.innerHTML=lenses.map(l=>'<button type="button" class="lens" data-lens="'+l.id+'" draggable="true" aria-label="Add '+escape(l.label)+' and show starters" aria-pressed="false"><span class="seal">'+icon(l.id)+'</span><span class="lens-label">'+escape(l.label)+'</span>'+icon('drag','grab')+'</button>').join('');
  group.addEventListener('click',e=>{const b=e.target.closest('button[data-lens]');if(b)chooseLens(b.dataset.lens)});
  group.addEventListener('dragstart',e=>{const b=e.target.closest('button[data-lens]');if(b){e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('application/x-quill-lens',b.dataset.lens)}});
  for(const zone of [$('#manuscript'),$('#sceneHero')]){
    zone.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/x-quill-lens')){e.preventDefault();e.dataTransfer.dropEffect='copy';zone.classList.add('dropping')}});
    zone.addEventListener('dragleave',e=>{if(!zone.contains(e.relatedTarget))zone.classList.remove('dropping')});
    zone.addEventListener('drop',e=>{zone.classList.remove('dropping');const lens=e.dataTransfer.getData('application/x-quill-lens');if(lensMap.has(lens)){e.preventDefault();chooseLens(lens)}});
  }
}
function chooseLens(id){const d=notebook.doc;if(!d||!lensMap.has(id))return;activeLens=id;tier=0;
  if(!d.lenses.includes(id)){d.lenses.push(id);notebook.touch()}
  paintLenses();paintStarters();status();
}
function paintLenses(){
  const d=notebook.doc;if(!d)return;
  const key=[d.id,...d.lenses,activeLens].join('|');
  if(key===chipKey)return;chipKey=key;
  $('#palette').querySelectorAll('[data-lens]').forEach(b=>b.setAttribute('aria-pressed',String(d.lenses.includes(b.dataset.lens))));
  const zone=$('#chipZone');
  const draw=()=>{$('#chipZone').innerHTML=d.lenses.length?d.lenses.map(id=>{const l=lensMap.get(id);if(!l)return '';return '<span class="chip '+(id===activeLens?'selected-chip':'')+'" data-lens="'+id+'"><button class="pick" aria-label="Show '+escape(l.label)+' starters">'+labeled(id,l.label)+'</button><button class="remove" aria-label="Remove '+escape(l.label)+'">'+icon('close')+'</button></span>'}).join(''):'<div class="empty-drop">'+icon('plus')+'Click or drag a sense, thought, or feeling here</div>';};
  if(ready)fadeSwap(zone,draw);else draw();
}
$('#chipZone').onclick=e=>{const chip=e.target.closest('.chip');if(!chip)return;const id=chip.dataset.lens;
  if(e.target.closest('.remove')){const d=notebook.doc;d.lenses=d.lenses.filter(x=>x!==id);if(activeLens===id){activeLens=d.lenses.at(-1)||'';tier=0}notebook.touch();paintLenses();paintStarters();status()}
  else if(e.target.closest('.pick'))chooseLens(id);
};
function paintStarters(){
  const key=activeLens+'|'+tier;
  if(starterKey===key) return;
  const first=!starterKey;starterKey=key;
  const surface=$('#starterBody');
  if(first) drawStarters();else fadeSwap(surface,drawStarters);
}
function drawStarters(){const box=$('#starterBody'),l=lensMap.get(activeLens || 'sound');
  const refocusTier=box.contains(document.activeElement)&&document.activeElement.hasAttribute('data-tier');
  box.innerHTML='<div class="starter-prompt"><span id="starterLens" class="starter-intro" data-lens="'+l.id+'"><span class="small-seal">'+icon(l.id)+'</span><strong>'+escape(l.label)+'</strong></span><p class="question">'+escape(l.question)+'</p></div><div class="tiers" aria-label="Starter level" role="group">'+tiers.map((t,i)=>'<button data-tier="'+i+'" aria-pressed="'+(i===tier)+'">'+t+'</button>').join('')+'</div><div class="starters">'+l.tiers[tier].map((s,i)=>'<button class="phrase" data-lens-id="'+l.id+'" data-level="'+tier+'" data-index="'+i+'" aria-label="Insert '+escape(s)+'"><span class="phrase-text">'+escape(s)+'</span><span class="ellipsis" aria-hidden="true">…</span></button>').join('')+'</div>';
  if(refocusTier)box.querySelector('[data-tier="'+tier+'"]')?.focus({preventScroll:true});
}
$('#starterBody').onclick=e=>{const t=e.target.closest('button[data-tier]');if(t){tier=Number(t.dataset.tier);paintStarters();return}
  const b=e.target.closest('button.phrase');if(b){const lens=b.dataset.lensId,level=Number(b.dataset.level);const phrase=lensMap.get(lens).tiers[level][Number(b.dataset.index)];insertPhrase(b,phrase,lens,level)}
};
function insertPhrase(button,phrase,lens,level){
  const d=notebook.doc;if(!d)return;stopInk();
  const start=editor.selectionStart??editor.value.length,end=editor.selectionEnd??start;
  const before=editor.value.slice(0,start),after=editor.value.slice(end);
  const gap=before&&!/[\s(“‘]$/.test(before)?' ':'';
  const add=gap+phrase+(!after||!/[\s,.;:!?)]/.test(after[0])?' ':'');
  if(editor.value.length+add.length-(end-start)>editor.maxLength){notice('This paragraph has reached the notebook’s size limit. Start another page to continue.');return}
  if(!d.lenses.includes(lens)){d.lenses.push(lens);activeLens=lens;paintLenses()}
  editor.setRangeText(add,start,end,'end');d.text=editor.value;d.status='draft';
  notebook.touch({type:'starter',lens,tier:level,phrase});status();
  flyInk(editor,button,phrase,start+gap.length);
  if(matchMedia('(pointer:fine)').matches)editor.focus({preventScroll:true});
}
editor.addEventListener('beforeinput',e=>{if(e.inputType==='insertText')finishFlight();else stopInk()});editor.addEventListener('pointerdown',stopInk);editor.addEventListener('input',e=>{const d=notebook.doc;if(!d)return;d.text=editor.value;d.status='draft';notebook.touch();status();writeTypedInk(editor,e)});
editor.addEventListener('keydown',e=>{if(['Home','End','PageDown','PageUp','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))stopInk()});
$('#hintButton').onclick=()=>{
  const hint=$('#hintText'),open=$('#hintButton').getAttribute('aria-expanded')!=='true';
  $('#hintButton').setAttribute('aria-expanded',String(open));
  if(open){hint.textContent=byId.get(notebook.doc.sceneId).hint;hint.hidden=false;reveal(hint);notebook.touch({type:'hint'});status()}
  else fadeSwap(hint,()=>{hint.hidden=true});
};
async function sendToTeacher() {
  const d=notebook.doc;
  if(!d || sending)return;
  if(reviews.get(d.id)?.state==='returned')return shareWall('revise');
  if(!d.text.trim()){editor.focus();notice('Write a little of your paragraph first.');return}
  if(!notebook.user || notebook.locked){signIn(true);return}
  if(d.sentAt && d.sentText===d.text){notice('Your teacher already has this version.');return}
  const owner=notebook.owner, intended=d.text;
  sending=true;
  if(d.status!=='finished'){d.status='finished';notebook.touch()}
  status();
  try {
    if(!(await notebook.flush()) || d.dirty)throw Error('Your paragraph is waiting to save. Try sending when the connection returns.');
    if(notebook.owner!==owner || d.text!==intended || d.status!=='finished')throw Error('Your paragraph changed. Send again when you are ready.');
    const result=await request('submissions/'+d.id,'POST',{owner,version:d.version});
    if(notebook.owner!==owner)return;
    d.sentText=result.receipt.text;d.sentAt=result.receipt.submittedAt;notebook.persist();
    notice('Sent to your teacher. You can keep writing on this page.');
  }catch(error){notice(error.message || 'Your paragraph could not be sent. Please try again.')}
  finally{sending=false;status()}
}
async function shareWall(action='share') {
  const d=notebook.doc;
  if (!d || sharing) return;
  const feedback=reviews.get(d.id);
  if(action==='share' && feedback?.state==='returned')action='revise';
  const publishing=action!=='withdraw';
  if(action==='revise' && !feedback)return;
  if (publishing && !d.text.trim()){editor.focus();notice('Write a little of your paragraph first.');return}
  if (!notebook.user || notebook.locked){signIn(publishing?'projector':false);return}
  const owner=notebook.owner, intendedText=d.text, intendedLenses=JSON.stringify(d.lenses);
  sharing=true;status();
  try {
    if(publishing){
      if (!await notebook.flush() || d.dirty) throw Error('Your paragraph is waiting to save. Try sharing again in a moment.');
      if (d.text!==intendedText || JSON.stringify(d.lenses)!==intendedLenses) throw Error('Your paragraph changed. Share it again when you are ready.');
    }
    if (owner!==notebook.owner || d!==notebook.doc) return;
    const receipt=await request('projection-share/'+d.id,'POST',{owner,action,version:publishing?d.version:d.sharedVersion,returnedVersion:action==='revise'?feedback.version:undefined});
    if (owner!==notebook.owner) return;
    if (publishing) {Object.assign(d,receipt);reviews.clear(d.id)}
    else Object.assign(d,{sharedVersion:null,sharedText:null,sharedLenses:[]});
    notebook.persist();
    notice(action==='revise'?'Revision sent to your teacher and shared on the story wall.':action==='share'?'Shared on the class story wall.':'Removed from the class story wall.');
  } catch(error){notice(error.message);void reviews.refresh()}
  finally {sharing=false;status()}
}
$('#shareWall').onclick=()=>shareWall();
$('#removeWall').onclick=()=>shareWall('withdraw');
$('#finish').onclick=sendToTeacher;
function status(){
  const d=notebook.doc;if(!d)return;
  reviews.track();
  const feedback=reviews.get(d.id);
  const returned=feedback?.state==='returned', unchanged=feedback && d.version<=feedback.version && !d.dirty;
  const shared=!feedback && d.sharedVersion && d.text===d.sharedText && JSON.stringify(d.lenses)===JSON.stringify(d.sharedLenses);
  const wallLabel=sharing?'Updating…':feedback?.state==='closed'&&unchanged?'Closed on projector':shared?'Shared on projector':!feedback&&d.sharedVersion?'Update projector':'Share on projector';
  const wall=$('#shareWall');
  if(wall.dataset.label!==wallLabel){wall.dataset.label=wallLabel;wall.innerHTML=labeled(shared?'check':'sparkle',wallLabel);reveal(wall,150)}
  wall.hidden=returned;wall.disabled=Boolean(shared||sharing||unchanged);$('#removeWall').hidden=Boolean(feedback)||!d.sharedVersion;$('#removeWall').disabled=sharing;
  const words=count(d.text);$('#wordCount').textContent=words+' '+(words===1?'word':'words');
  const sent=d.sentAt && d.sentText===d.text;
  const button=$('#finish'),label=returned?(sharing?'Sending…':'Send revision back'):sending?'Sending…':sent?'Sent to teacher':'Send to teacher';
  if(button.dataset.label!==label){button.dataset.label=label;button.innerHTML=labeled(sent&&!returned?'check':'quill',label);reveal(button,150)}
  button.disabled=returned?Boolean(unchanged||sharing||!d.text.trim()):Boolean(sent||sending);
  $('#saveLabel').textContent=notebook.user?(notebook.problem||(d.dirty?'Saving…':d.sentAt&&!sent?'Updated since you sent it':d.version?'Saved to My writing':'New paragraph')):'Practice · saved in this tab';
}
function update(part){if(!notebook.doc)return;if(part==='status'){status();if(hashSeen==='library')renderShelf();return}
  const d=notebook.doc,s=byId.get(d.sceneId)||scenes[0],changed=shownDoc!==d.id;
  if(changed){stopInk();activeLens=d.lenses.at(-1)||'';tier=0;shownDoc=d.id;$('#hintText').hidden=true;$('#hintButton').setAttribute('aria-expanded','false')}
  if(renderedScene!==s.id){
    const first=renderedScene===null;renderedScene=s.id;
    function drawScene(){
      $('#sceneTitle').textContent=s.title;$('#scenePrompt').textContent=s.prompt;$('#heroGenre').textContent=s.genre;
      $('#sceneNumber').textContent='Scene '+String(s.id).padStart(2,'0')+' / '+scenes.length;
      $('#heroArt').style.backgroundImage='url("./art/'+(s.id===1?'window':s.genre.toLowerCase())+'.webp")';
      renderScenery($('#sceneHero'),s);
    }
    if(first)drawScene();else fadeSwap($('#sceneHero'),drawScene);
  }
  if(editor.value!==d.text)editor.value=d.text;if(changed)editor.setSelectionRange(editor.value.length,editor.value.length);
  $('#accountLabel').textContent=notebook.user?.name||'Sign in';$('#navTeacher').hidden=!['admin','teacher'].includes(notebook.user?.role);
  paintLenses();paintStarters();status();if(hashSeen==='library')renderShelf();
}
let finishPreviews=()=>{};
modal.addEventListener('close',()=>finishPreviews());
function animateSceneChoices(){
  finishPreviews();
  const cleanups=[];
  const start=element=>{
    const clean=renderSceneryPreview(element,byId.get(Number(element.dataset.scenePreview)));
    if(typeof clean==='function')cleanups.push(clean);
  };
  const observer=new IntersectionObserver(entries=>{
    entries.filter(entry=>entry.isIntersecting).forEach(({target})=>{observer.unobserve(target);start(target)});
  },{root:modal,rootMargin:'40px'});
  $('#sceneChoices').querySelectorAll('[data-scene-preview]').forEach(element=>observer.observe(element));
  finishPreviews=()=>{observer.disconnect();cleanups.splice(0).forEach(clean=>clean());finishPreviews=()=>{}};
}
function chooseScene(){let genre='All',term='';const genres=['All','Silly','Fantasy','Scary','Gross'];
  dialog('<div class="kicker">The scene collection</div><h2 class="dialog-title">Choose a scene</h2><p class="dialog-desc">Each scene starts a fresh paragraph. Your current work stays in My writing.</p><div class="chooser-line"><label class="search-field">'+icon('search')+'<input id="sceneSearch" type="search" placeholder="Search scenes" aria-label="Search scenes"></label><button class="outline" id="surprise">'+labeled('dice','Surprise me')+'</button></div><div id="genreFilters" class="filters"></div><div id="sceneCount" class="chooser-count" aria-live="polite"></div><div id="sceneChoices" class="scene-list"></div>',true);
  function filtered(){return scenes.filter(s=>(genre==='All'||s.genre===genre)&&(s.title+' '+s.prompt).toLowerCase().includes(term))}
  function show(){const selected=filtered();$('#genreFilters').innerHTML=genres.map(g=>'<button aria-pressed="'+(g===genre)+'" data-g="'+g+'">'+g+'</button>').join('');
    $('#sceneCount').textContent=selected.length+' '+(selected.length===1?'scene':'scenes');$('#sceneChoices').innerHTML=selected.map(s=>'<button class="scene-card" data-id="'+s.id+'"><span class="scene-card-art" data-scene-preview="'+s.id+'" aria-hidden="true"></span><small>'+escape(s.genre)+' · '+String(s.id).padStart(2,'0')+'</small><h3>'+escape(s.title)+'</h3><p>'+escape(s.prompt)+'</p></button>').join('')||'<p>No scenes match your search.</p>';$('#surprise').disabled=!selected.length;animateSceneChoices()}
  function select(id){stopInk();closeDialog();turnPage(()=>{notebook.create(id);if(location.hash!=='#workshop')location.hash='workshop'});notice('Opened a fresh page.')}
  $('#genreFilters').onclick=e=>{const b=e.target.closest('[data-g]');if(b){genre=b.dataset.g;fadeSwap($('#sceneChoices'),show)}};
  $('#sceneSearch').oninput=e=>{term=e.target.value.trim().toLowerCase();fadeSwap($('#sceneChoices'),show)};
  $('#sceneChoices').onclick=e=>{const b=e.target.closest('button.scene-card');if(b)select(Number(b.dataset.id))};
  $('#surprise').onclick=()=>{let list=filtered();if(list.length>1)list=list.filter(s=>s.id!==notebook.doc.sceneId);if(list.length)select(list[Math.floor(Math.random()*list.length)].id)};show();
}
$('#changeScene').onclick=chooseScene;
function renderShelf(){const list=[...notebook.docs.values()].filter(d=>isMeaningful(d)||d.version).sort((a,b)=>Number(reviews.get(b.id)?.state==='returned')-Number(reviews.get(a.id)?.state==='returned') || String(b.updatedAt).localeCompare(String(a.updatedAt)));
  $('#shelfInfo').textContent=notebook.user?(notebook.problem||notebook.user.name+'’s saved paragraphs.'):'Practice writing stays in this tab. Sign in to use your notebook across devices.';
  $('#draftList').innerHTML=(list.length?'<div class="draft-grid">'+list.map(d=>{const scene=byId.get(d.sceneId);return '<button class="draft-card" data-doc="'+escape(d.id)+'"><small>'+escape(reviews.get(d.id)?.state==='returned'?'Teacher note · Revise':d.sentAt?(d.sentText===d.text?'Sent to teacher':'Revised since sending'):d.status==='finished'?'Finished':'Draft')+' · '+escape(scene?.genre)+'</small><h3>'+escape(scene?.title||'Scene')+'</h3><p>'+escape(d.text.trim().slice(0,130)||'Ingredients chosen')+'</p><small class="draft-date">'+count(d.text)+' words · '+escape(fmt(d.updatedAt))+'</small></button>'}).join('')+'</div>':'<div class="empty-shelf">'+icon('writing')+'<h3>Your notebook is ready</h3><p>Your paragraphs will appear here as you write.</p></div>')+'<div class="dialog-actions"><button class="outline" id="newParagraph">'+labeled('plus','New paragraph')+'</button>'+(!notebook.user?'<button class="primary" id="shelfSign">'+labeled('user','Sign in')+'</button>':'')+'</div>';
  $('#newParagraph').onclick=chooseScene;if($('#shelfSign'))$('#shelfSign').onclick=signIn;
}
$('#draftList').addEventListener('click',e=>{const b=e.target.closest('[data-doc]');if(b){notebook.open(b.dataset.doc);location.hash='workshop'}});
function signIn(sendAfter=false){
  if(!classConnected){
    dialog('<div class="kicker">Practice journal</div><h2 class="dialog-title">Open your class journal</h2><p class="dialog-desc">Your practice paragraph stays in this tab. Open the classroom in a new tab to sign in, send writing to your teacher, and share it on the projector.</p><div class="dialog-actions"><button class="outline" id="backToJournal">Keep practicing</button><a class="primary" href="https://quill-and-lantern.vercel.app/?login=1" target="_blank" rel="noopener">Class sign-in</a></div>');
    $('#backToJournal').onclick=closeDialog;
    return;
  }
  sendAfter=sendAfter===true?'teacher':sendAfter==='projector'?'projector':'';
  const previousOwner=notebook.user?.username;
  const guest=!notebook.user&&notebook.doc&&isMeaningful(notebook.doc)?structuredClone(notebook.doc):null;
  dialog('<div class="kicker">Quill &amp; Lantern</div><h2 class="dialog-title">Sign in to your journal</h2><p class="dialog-desc">Use your classroom username and password.</p><form id="loginForm"><label class="text-field"><span>Username</span><input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required></label><label class="text-field"><span>Password</span><input type="password" name="password" autocomplete="current-password" required></label>'+(sendAfter?'<p class="login-intent">Sign in to '+(sendAfter==='teacher'?'send this paragraph to your teacher.':'share this paragraph on the class projector.')+'</p>':guest?'<label><input type="checkbox" name="bring"> Save this practice paragraph to my notebook</label>':'')+'<p class="form-error" id="loginError" role="alert"></p><div class="dialog-actions"><button type="submit" class="primary">'+labeled('user','Sign in')+'</button></div></form>');
  $('#loginForm').onsubmit=async(e)=>{e.preventDefault();const form=e.currentTarget,b=form.querySelector('button[type=submit]');b.disabled=true;const data=new FormData(form);
    try{const result=await request('login','POST',{username:String(data.get('username')).trim(),password:String(data.get('password'))});sessionChanges?.postMessage('signed-in');
      if(result.user.role==='observer' || (returnWall && result.user.role==='admin')){location.replace('./observer.html');return}
      await notebook.load(result.user);
      if(guest&&(sendAfter||data.get('bring'))){const d=notebook.create(guest.sceneId);d.text=guest.text;d.lenses=[...guest.lenses];d.status=guest.status;d.events=[...guest.events];notebook.touch();update()}
      closeDialog();if(sendAfter && (!previousOwner || result.user.username===previousOwner)){if(sendAfter==='projector')await shareWall();else await sendToTeacher();return}
      if(returnTeacher&&['teacher','admin'].includes(result.user.role)){location.assign('./teacher.html');return}returnTeacher=false;notice('Welcome, '+result.user.name+'.')}
    catch(error){$('#loginError').textContent=error.status===429?'Too many attempts. Please try again in a few minutes.':error.status===401?'Check your username and password and try again.':'Could not sign in. Please try again.';b.disabled=false}
  };setTimeout(()=>$('#loginForm input')?.focus(),0);
}
function accountMenu(){if(!notebook.user||notebook.locked){signIn();return}
  dialog('<div class="kicker">Your journal</div><h2 class="dialog-title">'+escape(notebook.user.name)+'</h2><p class="dialog-desc">'+escape([notebook.user.classroom,['teacher','admin'].includes(notebook.user.role)?'Teacher account':'Student account'].filter(Boolean).join(' · '))+'</p><div class="account-actions">'+(!$('#navTeacher').hidden?'<a class="primary" href="./teacher.html">'+icon('teacher')+'Teacher dashboard</a>':'')+'<button id="leaveAccount" class="outline">Sign out</button></div><p class="form-error" role="alert" id="logoutError"></p>');
  $('#leaveAccount').onclick=async()=>{const b=$('#leaveAccount');b.disabled=true;try{if(!await notebook.flush()&&[...notebook.docs.values()].some(d=>d.dirty))throw new Error('Your writing is waiting to sync. Reconnect before signing out.');await request('logout','POST',{});sessionChanges?.postMessage('signed-out');notebook.discardDeviceCopy();await notebook.load(null);closeDialog();location.hash='desk';notice('Signed out.')}catch(e){$('#logoutError').textContent=e.message;b.disabled=false}};
}
$('#account').onclick=accountMenu;window.addEventListener('online',()=>{if(notebook.user)notebook.flush()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopInk();if(notebook.user)notebook.flush()}});
window.addEventListener('pagehide',()=>{if(notebook.doc)notebook.persist()});
async function init(){
  editor.disabled=true;$('#account').disabled=true;palette();route();
  let user=null;try{user=(await request('me')).user}catch{notice('The journal is in practice mode while it reconnects.')}
  if(user?.role==='observer'){location.replace('./observer.html');return}
  await notebook.load(user);ready=true;editor.disabled=false;$('#account').disabled=false;if(hashSeen==='library')renderShelf();fitCover();
  if(new URLSearchParams(location.search).get('login')==='1'){
    const next=new URLSearchParams(location.search).get('next');returnWall=next==='/observer';returnTeacher=next==='/teacher'||document.referrer.startsWith(new URL('./teacher.html',location.href).href);
    history.replaceState(null,'',location.pathname+location.hash);
    if(!notebook.user)signIn();else if(returnWall&&notebook.user.role==='admin')location.replace('./observer.html');else if(returnTeacher&&['admin','teacher'].includes(notebook.user.role))location.assign('./teacher.html');else accountMenu();
  }
}
init();
