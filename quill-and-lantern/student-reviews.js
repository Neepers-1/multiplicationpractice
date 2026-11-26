export function watchReviews(notebook,request,onChange){
  let owner='',items=new Map(),generation=0,fetching=false;
  const badge=document.createElement('span');
  badge.className='review-count';badge.hidden=true;
  document.querySelector('#navLibrary').append(badge);
  const panel=document.createElement('aside');
  panel.className='student-review';panel.hidden=true;
  const heading=document.createElement('strong'), note=document.createElement('p');
  heading.textContent='Your teacher’s revision note';panel.append(heading,note);
  document.querySelector('.journal-toolbar').after(panel);
  const stylesheet=document.createElement('link');
  stylesheet.rel='stylesheet';stylesheet.href=new URL('./student-reviews.css',import.meta.url).href;
  document.head.append(stylesheet);

  function paint(){
    const returned=[...items.values()].filter(r=>r.state==='returned').length;
    badge.hidden=!returned;badge.textContent=String(returned);
    badge.setAttribute('aria-label',returned+' awaiting revision');
    const feedback=items.get(notebook.current);
    panel.hidden=feedback?.state!=='returned';
    note.textContent=panel.hidden?'':feedback.note;
  }
  async function refresh(){
    if(!owner || fetching || document.hidden)return;
    const epoch=generation,expected=owner;fetching=true;
    try{
      const data=await request('drafts?view=wall-updates');
      if(epoch!==generation || expected!==notebook.user?.username || !Array.isArray(data.reviews) ||
          (data.owner && data.owner!==expected))return;
      const next=new Map(data.reviews.map(r=>[r.id,r]));
      const changed=next.size!==items.size || [...next].some(([id,r])=>{
        const before=items.get(id);
        return !before || before.version!==r.version || before.state!==r.state || before.note!==r.note;
      });
      items=next;
      if(changed){paint();onChange()}
    }catch{ /* Keep the last confirmed note until the journal reconnects. */ }
    finally{if(epoch===generation)fetching=false}
  }
  setInterval(refresh,10000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
  window.addEventListener('online',refresh);
  return {
    get:id=>items.get(id),
    track(){
      const next=notebook.user?.username||'';
      if(next!==owner){
        generation++;fetching=false;owner=next;items=new Map();void refresh();
      }
      paint();
    },
    clear(id){generation++;fetching=false;items.delete(id);paint();onChange()},
    refresh
  };
}
