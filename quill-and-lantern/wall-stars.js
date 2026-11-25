// Short, airy sound for giving a rating on the projector.
let soundContext, airBuffer, activeVoice;
function playStarSwoosh(count, reverse) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio || document.hidden) return;
  try {
    soundContext ||= new Audio({latencyHint:'interactive'});
    const ctx = soundContext;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (!airBuffer) {
      airBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .9), ctx.sampleRate);
      const samples = airBuffer.getChannelData(0);
      let soft = 0;
      for (let index = 0; index < samples.length; index++) {
        soft = soft * .68 + (Math.random() * 2 - 1) * .32;
        samples[index] = soft;
      }
    }

    const now = ctx.currentTime + .008;
    const duration = .21 + count * .065;
    activeVoice?.();
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const level = ctx.createGain();
    source.buffer = airBuffer;
    filter.type = 'bandpass';
    filter.Q.value = .64;
    filter.frequency.setValueAtTime(reverse ? 3200 : 860, now);
    filter.frequency.exponentialRampToValueAtTime(reverse ? 1150 : 3700, now + duration * .77);
    level.gain.setValueAtTime(.0001, now);
    level.gain.exponentialRampToValueAtTime(.22, now + duration * .39);
    level.gain.exponentialRampToValueAtTime(.075, now + duration * .70);
    level.gain.exponentialRampToValueAtTime(.0001, now + duration);
    source.connect(filter).connect(level).connect(ctx.destination);
    source.start(now);
    source.stop(now + duration + .02);
    const hush = () => {
      const stop = ctx.currentTime;
      if (level.gain.cancelAndHoldAtTime) level.gain.cancelAndHoldAtTime(stop);
      else level.gain.cancelScheduledValues(stop);
      level.gain.setTargetAtTime(.0001, stop, .006);
      source.stop(stop + .03);
    };
    activeVoice = hush;
    source.onended = () => {
      source.disconnect(); filter.disconnect(); level.disconnect();
      if (activeVoice === hush) activeVoice = null;
    };
  } catch { /* The visual rating also works when audio is unavailable. */ }
}

const starPath = 'M16 2.5 20.05 11l9.35 1.38-6.7 6.53 1.62 9.28L16 23.82l-8.32 4.37 1.62-9.28-6.7-6.53L11.95 11Z';
const starArt = '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="wall-star-outline" d="'+starPath+'"/><path class="wall-star-ink" d="'+starPath+'"/></svg><span class="wall-star-glint" aria-hidden="true">✦</span>';
const filled = 'inset(-10% -10% -10% -10%)';
const empty = 'inset(-10% 110% -10% -10%)';
const normalize = value => Number.isInteger(value) && value >= 1 && value <= 5 ? value : 0;

export function makeStars(username, value, onChange) {
  const element = document.createElement('div');
  element.className = 'wall-stars';
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', 'Star rating for ' + username);
  const buttons = [], animations = [];
  let chosen = -1;
  function stopAnimations() {
    for (const animation of animations) animation.cancel();
    animations.length = 0;
  }
  function animate(node, frames, options) {
    if (node.animate) animations.push(node.animate(frames, options));
  }
  function render(number, withMagic = false) {
    const next = normalize(number);
    if (chosen === next) return;
    const previous = Math.max(0, chosen);
    chosen = next;
    stopAnimations();
    for (const [index, button] of buttons.entries()) {
      const rank = index + 1;
      const selected = rank === next;
      const lit = rank <= next;
      button.classList.toggle('wall-star-lit', lit);
      button.setAttribute('aria-pressed', String(selected));
      button.tabIndex = rank === (next || 1) ? 0 : -1;
      button.title = selected ? 'Clear rating' : 'Give ' + rank + (rank === 1 ? ' star' : ' stars');
    }
    if (!withMagic || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const [index, button] of buttons.entries()) {
      const rank = index + 1;
      const ink = button.querySelector('.wall-star-ink');
      if (rank > previous && rank <= next) {
        animate(ink, [{clipPath:empty},{clipPath:filled}], {duration:185,delay:index*65,fill:'backwards',easing:'ease-out'});
      } else if (rank > next && rank <= previous) {
        animate(ink, [{clipPath:filled},{clipPath:empty}], {duration:155,delay:(previous-rank)*45,fill:'backwards',easing:'ease-in-out'});
      }
      if (rank <= next) {
        animate(button.querySelector('svg'), [
          {transform:'scale(1)'}, {transform:'scale(1.16)',filter:'drop-shadow(0 0 5px #ffd77c)'}, {transform:'scale(1)'}
        ], {duration:275,delay:index*65,easing:'ease-out'});
      }
      if (rank === next) {
        animate(button.querySelector('.wall-star-glint'), [
          {opacity:0,transform:'translate(-2px,3px) scale(.2)'},
          {offset:.4,opacity:1,transform:'translate(0,0) scale(1.12)'},
          {opacity:0,transform:'translate(2px,-4px) scale(.45)'}
        ], {duration:380,delay:index*65+75,easing:'ease-out'});
      }
    }
  }

  function select(number) {
    const previous = chosen;
    render(number, true);
    playStarSwoosh(Math.max(chosen, previous), chosen < previous);
    onChange(chosen);
  }
  for (let rank = 1; rank <= 5; rank++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wall-star';
    button.setAttribute('aria-label', 'Rate ' + username + ' ' + rank + ' out of 5 stars');
    button.innerHTML = starArt;
    button.addEventListener('click', event => {
      event.stopPropagation();
      select(chosen === rank ? 0 : rank);
    });
    button.addEventListener('keydown', event => {
      const targets = {ArrowRight:Math.min(rank+1,5), ArrowLeft:Math.max(rank-1,1), Home:1, End:5};
      if (targets[event.key]) {
        event.preventDefault(); event.stopPropagation();
        buttons[targets[event.key]-1].focus();
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && chosen) {
        event.preventDefault(); event.stopPropagation(); select(0);
      }
    });
    buttons.push(button); element.append(button);
  }
  element.addEventListener('pointerdown', event => event.stopPropagation());
  render(value);
  return {element, set(value) { render(value); }};
}
