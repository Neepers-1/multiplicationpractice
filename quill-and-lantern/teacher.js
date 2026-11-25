import {classFetch} from './classroom.js';
import {openInbox} from "./inbox.js";
import {closeSoftly,reveal} from "./transitions.js";
import {scenes,lenses} from "./content.js";
import {icon,logo} from "./icons.js";
import {isFinished,words,bangkokDay,enrich,selectDrafts,rank,summary,trend,weekActivity,comparison,csvValue} from "./teacher-metrics.js";

const $ = id => document.getElementById(id);
const esc = val => String(val??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const sceneMap=new Map(scenes.map(s=>[s.id,s])), tierNames=["Basic","Mid-tier","Pro-style"];
const lensName=new Map(lenses.map(l=>[l.id,l.label]));
const fmt = n=>n===null?"—":Number(n).toLocaleString("en-US",{maximumFractionDigits:1});
const nLabel=(n,s,p=s+"s")=>fmt(n)+" "+(n===1?s:p);
const dateFmt=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Bangkok",month:"short",day:"numeric",year:"numeric"});
const timeFmt=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Bangkok",month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",hour12:true});
function date(input,full=false) {
  if (!input) return "—";
  const dt = new Date(input.length===10 ? input+"T12:00:00Z" : input);
  return Number.isNaN(dt.valueOf()) ? "—" : (full?timeFmt:dateFmt).format(dt);
}
const heading=(title,subtitle="")=>'<div class="section-head"><div><h2>'+esc(title)+'</h2>'+(subtitle?'<p class="sub">'+esc(subtitle)+'</p>':'')+'</div></div>';
const status = d=>isFinished(d)?'<span class="pill">Finished</span>':'<span class="pill draft">In progress</span>';
const displayName=u=>state.byUser.get(u)?.name||u;
const group =(items,key)=>{const m=new Map();for(const item of items){const v=key(item);if(!m.has(v))m.set(v,[]);m.get(v).push(item);}return m;};
function table(headers,rows,caption) {
  return '<div class="box table-wrap" tabindex="0" role="region" aria-label="'+esc(caption)+'"><table><caption class="sr-only">'+esc(caption)+'</caption><thead><tr>'+headers.map(h=>'<th scope="col">'+esc(h)+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>';
}
const empty=message=>'<p class="empty">'+esc(message)+'</p>';
const state={roster:[],byUser:new Map(),drafts:[],selected:[],metrics:null,page:0,readingId:null};
const PAGE_SIZE=20;
const filters=$("filters");
function settings() {return Object.fromEntries(new FormData(filters));}
function overview(selected,roster,s) {
  const missing=roster.filter(u=>!s.authors.has(u.username));
  const tiles=[
    ["Writers who started",fmt(s.authors.size)+" / "+fmt(roster.length),"Writers with a saved paragraph in this selection"],
    ["Finished paragraphs",fmt(s.finished.length)+" / "+fmt(selected.length),nLabel(selected.length-s.finished.length,"paragraph")+" still in progress"],
    ["Words per finished paragraph",fmt(s.meanWords),"Average across "+nLabel(s.finished.length,"finished paragraph")],
    ["Sentences per finished paragraph",fmt(s.meanSentences),"Average across "+nLabel(s.finished.length,"finished paragraph")]
  ];
  const isFiltered = Object.values(settings()).some(Boolean);
  const waiting = missing.length?(isFiltered?"No matching work":"Yet to start")+' <strong>· '+esc(missing.map(u=>u.name).join(", "))+'</strong>':(roster.length?"Every selected writer has matching work.":"No enrolled writers.");
  const returns=selected.filter(d=>d.activeDays.length>1);
  const working=returns.filter(d=>!isFinished(d));
  const firstFinishes=selected.map(d=>({d,baseline:comparison(d)})).filter(({baseline})=>baseline?.label==="First finish");
  const revised=firstFinishes.filter(({d,baseline})=>baseline.before.text!==d.text);
  const changed=revised.slice(0,3).map(({d})=>'<button type="button" class="link" data-read="'+esc(d.id)+'">'+esc(displayName(d.username)+" · "+d.scene.title)+'</button>');
  const open=working.slice(0,3).map(d=>'<button type="button" class="link" data-read="'+esc(d.id)+'">'+esc(displayName(d.username)+" · "+d.scene.title)+'</button>');
  return '<div class="cards">'+tiles.map(([title,value,caption])=>'<article class="box card"><h3>'+esc(title)+'</h3><strong class="num">'+esc(value)+'</strong><small>'+esc(caption)+'</small></article>').join("")+'</div><div class="callout">'+waiting+'</div>'+
    '<details class="conference box"><summary>Writing conference notes</summary><div class="twocol"><div><h3>Returned to a draft</h3><p>'+fmt(returns.length)+' of '+nLabel(selected.length,"paragraph")+' had activity on two or more days. '+fmt(working.length)+' of those are still in progress.</p>'+open.map(x=>'<p>'+x+'</p>').join("")+'</div><div><h3>Revised after first finish</h3><p>'+fmt(revised.length)+' of '+nLabel(firstFinishes.length,"paragraph")+' with a first-finish checkpoint have different text today.</p>'+changed.map(x=>'<p>'+x+'</p>').join("")+'</div></div></details>';
}
function writers(all,roster) {
  const byName=group(all,d=>d.username);
  const rows=roster.map(u=>{
    const drafts=byName.get(u.username)||[], s=summary(drafts), t=trend(drafts);
    const change=t?'<span class="nowrap">'+fmt(t.early.words)+' → '+fmt(t.recent.words)+'</span> words<br><span class="nowrap">'+fmt(t.early.sentences)+' → '+fmt(t.recent.sentences)+'</span> sentences<br><small>'+esc(nLabel(t.n,"piece"))+' per group</small>':'<span class="small">Needs 2 finished pieces</span>';
    return '<tr><th scope="row"><button type="button" class="link" data-writer="'+esc(u.username)+'" title="Show writing by '+esc(u.name)+'">'+esc(u.name)+'</button></th><td>'+fmt(drafts.length)+'</td><td>'+fmt(s.finished.length)+'</td><td>'+fmt(s.meanWords)+'</td><td>'+change+'</td><td class="nowrap">'+esc(drafts.length?date(drafts[0].updatedAt):"—")+'</td></tr>';
  });
  return heading("Writer register","Choose a name to read that writer’s paragraphs.")+table(["Writer","Started","Finished","Avg. words¹","Earlier → recent¹","Last edit"],rows,"Writers in this selection")+
  '<p class="table-note">¹ Finished work only. Earlier and recent groups contain the same number of pieces, up to three each, ordered by first finish. Figures compare average words and sentences per paragraph using the latest saved text.</p>';
}
function bar(label,n,denom,end) {
  const pc=denom?Math.round(n/denom*100):0;
  return '<li><div class="rline"><strong>'+label+'</strong><span>'+end+'</span></div><div class="meter" aria-hidden="true"><b style="width:'+pc+'%"></b></div></li>';
}
function panel(title,description,body) {
  return '<article class="box craft-panel"><h3>'+esc(title)+'</h3><p class="sub">'+esc(description)+'</p>'+body+'</article>';
}
function rankedList(counts,label,none,choices=[]) {
  if (!counts.length) return empty(none);
  return '<ol class="rank">'+counts.slice(0,8).map(([key,n])=>'<li>'+esc(key)+'<span>'+esc(nLabel(n,label))+(choices.length?' · '+esc(nLabel(choices.filter(d=>d.openings.includes(key)).length,"paragraph")):"")+'</span></li>').join("")+'</ol>';
}
function craft(selected,s) {
  return heading("Writing choices")+ '<div class="twocol">'+
    panel("Ingredients used for starters","Each writer’s paragraph counts once per ingredient they used to insert a starter.",
      '<ul class="rows">'+lenses.map(l=>bar('<span class="lens-title">'+icon(l.id)+esc(l.label)+'</span>',s.lensPieces.get(l.id)||0,selected.length,fmt(s.lensPieces.get(l.id)||0)+' / '+nLabel(selected.length,"paragraph"))).join("")+'</ul>')+
    panel("Starter tiers","Counts every insertion, including starters a writer later changed or removed.",
      '<ul class="rows">'+tierNames.map((name,i)=>bar(esc(name),s.tiers[i],s.insertions,fmt(s.tiers[i])+' / '+fmt(s.insertions))).join("")+'</ul><p class="small">'+esc(nLabel(s.annotated,"paragraph"))+' used a starter out of '+fmt(selected.length)+'.</p><h3 style="margin-top:22px">Hint use</h3><p>'+esc(nLabel(s.hints,"hint opening"))+' across '+esc(nLabel(s.withHints,"paragraph"))+' out of '+fmt(selected.length)+'.</p>')+
    panel("Most inserted starters","Up to eight of the most frequently chosen scaffold buttons in these paragraphs.",rankedList(rank(s.phraseCounts),"insertion","No starters have been inserted."))+
    panel("Repeated sentence openings","First two words found in the latest text, ignoring capitalization. The same pair must occur at least twice.",rankedList(rank(s.openings).filter(([,n])=>n>1),"occurrence","No repeated two-word openings in this selection.",selected)+
      '<p class="small">'+esc(nLabel(s.openingCount,"sentence opening"))+' with two or more words across '+esc(nLabel(s.withOpenings,"paragraph"))+'.</p>')+'</div>';
}
function activity(selected,range,today) {
  const weeks=weekActivity(selected,range,today);
  const render=w=>'<tr><th scope="row">'+esc(date(w.start))+'</th><td>'+fmt(w.authors.size)+'</td><td>'+fmt(w.pieces.size)+'</td><td>'+fmt(w.finishes)+'</td></tr>';
  const heads=["Week of Monday","Active writers","Active paragraphs","First finishes"];
  const older=weeks.slice(0,-8);
  return heading("Weekly activity","Bangkok calendar weeks. A saved writing day counts once per writer and paragraph. Each paragraph has one first finish.")+
  (weeks.length?(older.length?'<details><summary>Show '+esc(nLabel(older.length,"earlier week"))+'</summary>'+table(heads,older.map(render),"Earlier weekly writing activity")+'</details>':'')+table(heads,weeks.slice(-8).map(render),"Weekly writing activity"): '<div class="box">'+empty("Weekly activity will appear when a writer saves a paragraph.")+'</div>');
}
function paragraphs() {
  const all=state.selected;
  let html=heading("Student paragraphs",nLabel(all.length,"paragraph")+" in this selection, most recently edited first.");
  if (!all.length) {$("writing").innerHTML=html+'<div class="box">'+empty("No paragraphs match these filters.")+'</div>';return;}
  const start=state.page*PAGE_SIZE, slice=all.slice(start,start+PAGE_SIZE);
  const rows=slice.map(d=>'<tr><th scope="row"><button class="link" type="button" data-read="'+esc(d.id)+'">'+esc(d.scene.title)+'</button><br><span class="small">'+esc(d.scene.genre)+'</span></th><td>'+esc(displayName(d.username))+'</td><td>'+status(d)+'</td><td>'+fmt(d.wordCount)+'</td><td>'+fmt(d.sentenceCount)+'</td><td class="nowrap">'+date(d.updatedAt)+'</td></tr>');
  html+=table(["Scene","Writer","Status","Words","Sentences","Last edit"],rows,"Student paragraphs");
  if (all.length>PAGE_SIZE) html+='<div class="pager"><span>'+fmt(start+1)+'–'+fmt(start+slice.length)+' of '+fmt(all.length)+'</span><div><button class="outline" data-page="-1" '+(!state.page?"disabled":"")+'>Previous page</button><button class="outline" data-page="1" '+(start+slice.length>=all.length?"disabled":"")+'>Next page</button></div></div>';
  html+='<details><summary>How words and sentences are counted</summary><p class="small">Words are groups of letters or numbers. A contraction or hyphenated term counts as one word. Sentence estimates use English sentence boundaries and include a final unfinished segment. Punctuation and abbreviations can affect the estimate.</p></details>';
  $("writing").innerHTML=html;
}
function render() {
  const f=settings(),today=bangkokDay();
  state.selected=selectDrafts(state.drafts,f,today);
  const selected=state.selected, roster=state.roster.filter(u=>!f.student || u.username===f.student),s=summary(selected);
  state.metrics=s;state.page=0;
  $("overview").innerHTML=overview(selected,roster,s);
  $("writers").innerHTML=writers(selected,roster);
  $("craft").innerHTML=craft(selected,s);
  $("activity").innerHTML=activity(selected,f.range,today);
  paragraphs();
  $("selection").textContent=nLabel(selected.length,"matching paragraph")+" from "+nLabel(s.authors.size,"writer")+".";
  $("download").disabled=!selected.length;
}
function read(d) {
  state.readingId=d.id;
  $("readingBy").textContent=displayName(d.username)+" · "+d.scene.genre;
  $("readingTitle").textContent=d.scene.title;
  const stat=nLabel(d.wordCount,"word")+" · "+nLabel(d.sentenceCount,"sentence");
  const chosen=(Array.isArray(d.lenses)?d.lenses:[]).map(l=>lensName.get(l)).filter(Boolean);
  const firstDraft=comparison(d);
  let revision = empty("The first saved checkpoint will appear here when available.");
  if (firstDraft) {
    const {before,measures,label}=firstDraft;
    const delta=(a,b)=>a-b>0?"+"+fmt(a-b):fmt(a-b);
    const same=before.text===d.text;
    revision='<div class="meta"><span class="chip">'+esc(delta(d.wordCount,measures.wordCount))+' words</span><span class="chip">'+esc(delta(d.sentenceCount,measures.sentenceCount))+' sentences</span></div><div class="twocol"><div><h4>'+esc(label)+'</h4><p class="small">'+date(before.at,true)+' · '+nLabel(measures.wordCount,"word")+'</p><p class="reading-text">'+esc(before.text)+'</p></div><div><h4>Latest saved version</h4><p class="small">'+date(d.updatedAt,true)+' · '+nLabel(d.wordCount,"word")+'</p>'+(same?'<p class="reading-text">The text matches the checkpoint.</p>':'<p class="reading-text">'+esc(d.text)+'</p>')+'</div></div>';
  }
  const saved =d.checkpoints.length?'<details><summary>Saved checkpoints ('+fmt(d.checkpoints.length)+')</summary>'+d.checkpoints.map(p=>'<details class="checkpoint"><summary>'+date(p.at,true)+' · '+(p.status==="finished"?"Finished":"In progress")+' · '+nLabel(words(p.text).length,"word")+'</summary><p class="reading-text">'+esc(p.text)+'</p></details>').join("")+'</details>':'';
  const insertionRows=d.starters.slice().sort((a,b)=>b[1].count-a[1].count).map(([phrase,v])=>'<tr><th scope="row">'+esc(phrase)+'</th><td>'+esc(lensName.get(v.lens)||v.lens)+'</td><td>'+esc(tierNames[v.tier])+'</td><td>'+fmt(v.count)+'</td></tr>');
  $("readingBody").innerHTML='<p class="prompt">'+esc(d.scene.prompt)+'</p><section><h3>Latest paragraph</h3><p class="meta">'+status(d)+'<span class="small">'+esc(stat)+' · Last edited '+date(d.updatedAt,true)+'</span></p><p class="reading-text">'+esc(d.text)+'</p></section>'+
    '<section><h3>Revisions</h3>'+revision+saved+'</section><section><h3>Writing choices</h3><p class="small">Ingredients on the page: '+esc(chosen.join(", ")||"None")+'. Hint openings: '+fmt(d.hints)+'.</p>'+(insertionRows.length?table(["Starter inserted","Ingredient","Tier","Insertions"],insertionRows,"Starters inserted into this paragraph"):empty("No starter button insertions recorded."))+'</section>';
  if(!$("reading").open)$("reading").showModal();
  $("reading").scrollTop=0;
}
function exportCSV() {
  const header=["Writer","Username","Class","Scene","Genre","Status","Created (Bangkok)","Last edited (Bangkok)","First finished (Bangkok)","Words","Sentences (estimated)","Ingredients currently selected","Starter insertions","Basic insertions","Mid-tier insertions","Pro-style insertions","Hint openings","Recorded writing days","Current paragraph"];
  const rows=state.selected.map(d=>{
    const s=summary([d]);
    return [displayName(d.username),d.username,state.byUser.get(d.username)?.classroom,d.scene.title,d.scene.genre,isFinished(d)?"Finished":"In progress",date(d.createdAt,true),date(d.updatedAt,true),date(d.analytics?.firstFinishedAt,true),d.wordCount,d.sentenceCount,(d.lenses||[]).map(l=>lensName.get(l)||l).join(", "),s.insertions,...s.tiers,d.hints,d.activeDays.length,d.text];
  });
  const body="\uFEFF"+[header,...rows].map(row=>row.map(csvValue).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([body],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");
  a.href=url;a.download="Quill-and-Lantern-"+bangkokDay()+".csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function gate(title,msg,links) {
  $("privateNotebook").hidden=true;$("gate").hidden=false;
  $("gate").innerHTML='<h2>'+esc(title)+'</h2><p>'+esc(msg)+'</p><div class="gate-actions">'+links+'</div>';
}
async function load() {
  const response=await classFetch("me",{cache:"no-store",credentials:"same-origin"});
  if (!response.ok) throw new Error("Could not check your account.");
  const me=(await response.json()).user;
  if (!me || !["admin","teacher"].includes(me.role)) {
    gate("Teacher sign-in",me?"This account has student access. Open the workshop and switch to your teacher account.":"Sign in with your teacher account in the workshop, then select Teacher.",'<a class="outline" href="./?login=1&amp;next=/teacher">Open workshop sign-in</a>'); return;
  }
  $("privateNotebook").hidden=false;$("gate").hidden=true;openInbox();
  let offset=0;
  const records=new Map(),roster=new Map(),seenOffsets=new Set();
  while(offset!==null) {
    if(seenOffsets.has(offset))throw new Error("The notebook returned an incomplete page.");
    seenOffsets.add(offset);
    const res=await classFetch("teacher?offset="+encodeURIComponent(offset),{cache:"no-store",credentials:"same-origin"});
    if(res.status===401 || res.status===403) {gate("Teacher sign-in","Your teacher session is required to view writing.",'<a class="outline" href="./?login=1&amp;next=/teacher">Open workshop sign-in</a>');return;}
    if(!res.ok)throw new Error("The notebook could not load all saved writing.");
    const page=await res.json();
    for(const u of page.roster||[])if(u.username && !["test","admin"].includes(u.username.toLowerCase()) && (!u.role || u.role==="student") && (!u.classroom || /^(?:grade\s*)?5\s*a$/i.test(u.classroom)))roster.set(u.username,u);
    for(const d of page.drafts||[])records.set(d.id,d);
    offset=page.nextOffset??null;
  }
  state.roster=[...roster.values()].sort((a,b)=>a.name.localeCompare(b.name));state.byUser=roster;
  state.drafts=[...records.values()].filter(d=>roster.has(d.username)).map(d=>enrich(d,sceneMap)).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))||String(b.id).localeCompare(String(a.id)));
  for(const u of state.roster)filters.elements.student.add(new Option(u.name,u.username));
  $("privateNotebook").hidden=false;$("gate").hidden=true;render();
}
$("brandmark").innerHTML=logo;$("lantern").innerHTML=icon("lantern");
filters.addEventListener("submit",e=>e.preventDefault());
filters.addEventListener("change",render);filters.addEventListener("reset",()=>queueMicrotask(render));
$("download").addEventListener("click",exportCSV);
$("closeReading").addEventListener("click",()=>closeSoftly($("reading")));
document.addEventListener("click",e=>{
  const btn=e.target.closest("button");
  if(!btn)return;
  if(btn.dataset.writer){filters.elements.student.value=btn.dataset.writer;render();$("writing").scrollIntoView({block:"start"});const first=$("writing").querySelector("button")||filters.elements.student;first.focus({preventScroll:true});}
  if(btn.dataset.read){const d=state.selected.find(x=>String(x.id)===btn.dataset.read);if(d)read(d);}
  if(btn.dataset.page){state.page+=Number(btn.dataset.page);paragraphs();const x=$("writing").querySelector("button[data-read]");x?.focus();}
  if(btn.id==="reload")location.reload();
});
// A back-forward cache restore must recheck the current account before painting private work.
window.addEventListener("pagehide",()=>{$("privateNotebook").hidden=true;if($("reading").open)$("reading").close();});
window.addEventListener("pageshow",e=>{if(e.persisted)location.reload();});
$("reading").addEventListener("cancel",e=>{e.preventDefault();closeSoftly($("reading"));});
if(typeof BroadcastChannel==="function"){
  const sessions=new BroadcastChannel("quill-account");sessions.onmessage=()=>{$("privateNotebook").hidden=true;if($("reading").open)$("reading").close();location.reload()};
}
load().catch(()=>gate("The notebook could not load","Check your connection and try again to load the complete class data.",'<button id="reload" class="outline" type="button">Try again</button>'));
