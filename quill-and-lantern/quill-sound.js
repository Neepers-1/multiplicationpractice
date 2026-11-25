// The writing sample is the teacher's original recording. Keep the nib quiet
// while letters travel, and play a continuous stroke for each written word.
const preferenceKey = 'quill-letter-sound-v1';
let muted = readMute();
let audio, decoded, sampleBytes, cancelActive;

function readMute() {
  try { return localStorage.getItem(preferenceKey) === 'muted'; }
  catch { return false; }
}

function loadBytes() {
  if (!sampleBytes) {
    sampleBytes = fetch('./audio/quill-on-paper.mp3').then(response => {
      if (!response.ok) throw new Error('Writing sample unavailable');
      return response.arrayBuffer();
    }).catch(() => { sampleBytes = null; return null; });
  }
  return sampleBytes;
}

export function bindQuillSound(button) {
  function paint() {
    button.setAttribute('aria-label', 'Quill writing sound');
    button.setAttribute('aria-pressed', String(!muted));
    button.dataset.muted = String(muted);
    button.title = muted ? 'Turn on quill writing sound' : 'Mute quill writing sound';
  }
  function restore() {
    muted = readMute();
    if (muted) cancelActive?.();
    else loadBytes();
    paint();
  }
  restore();
  button.addEventListener('click', () => {
    muted = !muted;
    try { localStorage.setItem(preferenceKey, muted ? 'muted' : 'on'); } catch {}
    if (muted) cancelActive?.();
    else loadBytes();
    paint();
  });
  window.addEventListener('storage', event => {
    if (!event.key || event.key === preferenceKey) restore();
  });
  window.addEventListener('pagehide', () => cancelActive?.());
}

function wordTimings(strokes, reduced) {
  if (reduced) return [{start:strokes[0].landing, end:strokes[0].landing+160}];
  const words = [];
  for (const {landing, stroke} of strokes) {
    const last = words.at(-1);
    if (last && landing - last.end < 36) last.end = landing + stroke;
    else words.push({start:landing, end:landing + stroke});
  }
  return words;
}

export function beginQuillWriting(strokes, reduced = false) {
  cancelActive?.();
  if (muted || !strokes.length) return () => {};
  const started = performance.now();
  let canceled = false;
  const voices = new Set();
  function stop() {
    if (canceled) return;
    canceled = true;
    for (const {source, level} of voices) {
      const now = audio.currentTime;
      level.gain.cancelScheduledValues(now);
      level.gain.setTargetAtTime(0, now, .004);
      try { source.stop(now + .025); } catch {}
    }
    if (cancelActive === stop) cancelActive = null;
  }
  cancelActive = stop;
  async function play() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audio ||= new Audio({latencyHint:'interactive'});
    // Request playback during the click, before waiting on the download.
    const unlocked = audio.state === 'running' ? Promise.resolve() : audio.resume();
    decoded ||= loadBytes().then(bytes => bytes && audio.decodeAudioData(bytes.slice(0)))
      .catch(() => null);
    const [sample] = await Promise.all([decoded, unlocked]);
    if (!sample) decoded = null;
    if (!sample || canceled || muted || document.hidden || audio.state !== 'running') return;
    const now = audio.currentTime;
    const origin = now - (performance.now() - started) / 1000;
    const offsets = [.065, .15, .62, .09, .27];
    wordTimings(strokes, reduced).forEach(({start,end}, index) => {
      const at = Math.max(now, origin + start/1000);
      const duration = origin + end/1000 - at;
      if (duration < .015) return;
      const source = audio.createBufferSource();
      source.buffer = sample;
      source.loop = true;
      source.loopStart = .03;
      source.loopEnd = Math.min(1.43, sample.duration);
      const offset = offsets[index % offsets.length];
      const level = audio.createGain();
      const attack = Math.min(.009, duration/4);
      const release = Math.min(.018, duration/3);
      // The original is a very quiet close recording (peak -25.6 dBFS).
      const gain = reduced ? 3.2 : 5.5;
      level.gain.setValueAtTime(0, at);
      level.gain.linearRampToValueAtTime(gain, at+attack);
      level.gain.setValueAtTime(gain, at+duration-release);
      level.gain.linearRampToValueAtTime(0, at+duration);
      source.connect(level).connect(audio.destination);
      const voice = {source,level};
      voices.add(voice);
      source.onended = () => { source.disconnect(); level.disconnect(); voices.delete(voice); };
      source.start(at, offset);
      source.stop(at+duration);
    });
  }
  play().catch(stop);
  return stop;
}
