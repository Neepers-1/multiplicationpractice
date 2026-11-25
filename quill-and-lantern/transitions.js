// Stale animation callbacks must never repaint a control after a newer choice.
const running=new WeakMap();
const reduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
function cancel(element) {
  const previous=running.get(element);
  if(previous){running.delete(element);previous.cancel()}
}
export function reveal(element,duration=210) {
  if(!element || !element.animate) return;
  cancel(element);
  const animation=element.animate([{opacity:0},{opacity:1}],{duration:reduce()?45:duration,easing:"ease-out"});
  running.set(element,animation);
  animation.onfinish=()=>{if(running.get(element)===animation)running.delete(element)};
}
export function fadeSwap(element,paint) {
  if(!element || !element.animate || !element.getClientRects().length){paint();return}
  const start=getComputedStyle(element).opacity;
  cancel(element);
  const animation=element.animate([{opacity:start},{opacity:0}],{duration:reduce()?40:105,easing:"ease-in",fill:"forwards"});
  running.set(element,animation);
  animation.onfinish=()=>{
    if(running.get(element)!==animation)return;
    running.delete(element);animation.cancel();paint();reveal(element);
  };
}
export function closeSoftly(dialog) {
  if(!dialog.open || dialog.dataset.closing)return;
  if(!dialog.animate){dialog.close();return}
  dialog.dataset.closing="1";
  const end=dialog.animate([{opacity:1},{opacity:0}],{duration:reduce()?40:125,easing:"ease-in"});
  end.onfinish=()=>{if(dialog.dataset.closing){delete dialog.dataset.closing;dialog.close()}};
}
export function turnPage(paint) {
  if(document.startViewTransition && !reduce()) {
    const transition=document.startViewTransition(paint);
    transition.ready.catch(()=>{});
  } else {
    fadeSwap(document.querySelector("main")||document.body,paint);
  }
}
