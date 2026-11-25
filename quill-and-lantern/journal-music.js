const preferenceKey = 'quill-background-music-v1';
export function bindJournalMusic(player, button) {
  function preferred() {
    try {
      const choice = localStorage.getItem(preferenceKey);
      return choice ? choice === 'on' : localStorage.getItem('quill-letter-sound-v1') !== 'muted';
    } catch { return true; }
  }
  let enabled = preferred();
  player.volume = .12;

  function paint() {
    const playing = enabled && !player.paused;
    button.setAttribute('aria-pressed', String(playing));
    button.dataset.muted = String(!enabled);
    button.title = playing ? 'Pause background music' : 'Play background music';
  }
  function start() {
    if (!enabled || document.hidden || !player.paused) return;
    // Some browsers wait for a gesture. Retry from that gesture on the same player.
    player.play().catch(paint);
  }
  function onGesture(event) {
    if (!button.contains(event.target)) start();
  }
  button.addEventListener('click', () => {
    enabled = !enabled || player.paused;
    try { localStorage.setItem(preferenceKey, enabled ? 'on' : 'muted'); } catch {}
    if (enabled) start();
    else player.pause();
    paint();
  });
  player.addEventListener('play', paint);
  player.addEventListener('pause', paint);
  player.addEventListener('error', paint);
  document.addEventListener('click', onGesture, true);
  document.addEventListener('keydown', onGesture, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) player.pause();
    else start();
  });
  window.addEventListener('pagehide', () => player.pause());
  window.addEventListener('pageshow', start);
  window.addEventListener('storage', event => {
    if (event.key && event.key !== preferenceKey) return;
    enabled = preferred();
    if (enabled) start();
    else player.pause();
    paint();
  });
  paint();
  start();
}
