const icons={
  smaller:['Decrease paragraph font size','M6 12h12'],
  larger:['Increase paragraph font size','M6 12h12m-6-6v12'],
  return:['Send back for revision','M9 5l-6 6 6 6M4 11h10a6 6 0 0 1 6 6v2'],
  close:['Close submission','m6 6 12 12M18 6 6 18']
};
export function addReviewControls(card, story, save, moderate) {
  const bar=card.el.querySelector('.wall-tools');
  for(const [action,[label,path]] of Object.entries(icons)) {
    const button=document.createElement('button');
    button.type='button';button.className='wall-review-control wall-'+action;
    button.title=label;button.setAttribute('aria-label',label);
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
    bar.append(button);
    if(action==='smaller'||action==='larger'){
      button.onclick=()=>save(card,{fontStep:Math.max(-4,Math.min(4,card.fontStep+(action==='larger'?1:-1)))});
    }else if(action==='close') {
      button.onclick=()=>moderate(card,'close');
    }else {
      button.onclick=()=>{
        if(card.reviewOpen||card.moderating)return;
        const dialog=document.createElement('dialog');
        dialog.className='wall-return-dialog';
        dialog.innerHTML='<form><h2 id="return-title">Send back for revision</h2><p class="recipient"></p><label for="return-note">What should the writer revise?</label><textarea id="return-note" required maxlength="1500" rows="4" placeholder="Describe what you heard just before the window opened."></textarea><p class="review-error" role="alert"></p><footer><button type="button" class="cancel">Cancel</button><button type="submit">Send back</button></footer></form>';
        dialog.setAttribute('aria-labelledby','return-title');
        dialog.querySelector('.recipient').textContent='Note for '+story.username;
        document.body.append(dialog);
        card.reviewOpen=true;
        card.dismissReview=()=>dialog.close();
        const form=dialog.querySelector('form'),note=form.querySelector('textarea');
        const cancel=form.querySelector('.cancel'),submit=form.querySelector('[type=submit]');
        cancel.onclick=()=>dialog.close();
        dialog.addEventListener('cancel',e=>{if(card.moderating)e.preventDefault()});
        dialog.addEventListener('close',()=>{
          card.reviewOpen=false;card.dismissReview=null;card.start=Date.now();dialog.remove();
          if(!card.leaving && button.isConnected)button.focus({preventScroll:true});
        },{once:true});
        form.onsubmit=async e=>{
          e.preventDefault();
          if(!note.value.trim()){note.focus();return}
          cancel.disabled=submit.disabled=note.disabled=true;
          const result=await moderate(card,'return',note.value.trim());
          if(!dialog.open)return;
          if(result.ok)dialog.close();
          else {cancel.disabled=submit.disabled=note.disabled=false;form.querySelector('.review-error').textContent=result.message;note.focus()}
        };
        dialog.showModal();note.focus();
      };
    }
  }
}
export function paintFont(card){
  card.el.style.setProperty('--font-factor',String(1.16**card.fontStep));
  card.el.querySelector('.wall-smaller').disabled=card.fontStep<=-4;
  card.el.querySelector('.wall-larger').disabled=card.fontStep>=4;
}
