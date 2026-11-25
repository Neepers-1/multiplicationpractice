// Candle flame, cast light and reflections share one continuously varying light source.
const flameArtwork = `
  <svg class="quill-flame" viewBox="0 0 42 68" aria-hidden="true">
    <defs>
      <radialGradient id="quill-fire" cx="51%" cy="70%" r="70%">
        <stop stop-color="#ffffdf"/><stop offset=".26" stop-color="#fff3ac"/>
        <stop offset=".63" stop-color="#ffcd54"/><stop offset=".88" stop-color="#fb8d2e"/>
        <stop offset="1" stop-color="#d76719"/>
      </radialGradient>
      <linearGradient id="quill-core" x2="0" y2="1">
        <stop stop-color="#fff0bd"/><stop offset=".58" stop-color="#ffffef"/>
        <stop offset="1" stop-color="#b6b9ff"/>
      </linearGradient>
    </defs>
    <path class="fire-outer" fill="url(#quill-fire)" d="M21 63 C5 61 11 33 22 7 C24 31 36 50 29 59 Q26 64 21 63Z"/>
    <path class="fire-core" fill="url(#quill-core)" d="M21 62 C15 58 18 49 22 36 Q22 48 26 54 Q29 61 21 62Z"/>
  </svg>`;

function element(className, tag = "div") {
  const node = document.createElement(tag);
  node.className = className;
  node.setAttribute("aria-hidden", "true");
  return node;
}

// Independent smooth harmonics approximate the changing fuel flow and weak drafts
// of a real wick. Their periods do not line up into a perceptible short loop.
function flameState(t) {
  const slow = Math.sin(t * 1.65) + .45 * Math.sin(t * 2.81 + 2);
  const heat = .53 + .13 * slow + .065 * Math.sin(t * 5.7) + .03 * Math.sin(t * 9.37 + 1);
  const lean = 6.8 * Math.sin(t * 2.35) + 3.8 * Math.sin(t * 4.18 + 2.4) + 1.9 * Math.sin(t * 7.17);
  return {heat, lean};
}

export function initCandlelight() {
  if (document.querySelector(".quill-candle")) return;
  const cover = document.querySelector("#deskCover");
  const picture = cover.querySelector(".desk-picture");
  const spread = document.querySelector(".book-spread");
  const surface = element("quill-desk-surface");
  const lamp = element("quill-lantern-glow");
  const lanternFlame = element("quill-lantern-flame");
  const moon = element("quill-moon-sheen");
  const lightDust = element("quill-desk-dust");
  for (let i = 0; i < 13; i++) {
    const mote = document.createElement("i");
    const swath = i % 3 ? .61 + ((i * .159) % .34) : .085 + ((i * .193) % .27);
    mote.style.left = swath * 100 + "%";
    mote.style.top = 19 + ((i * 37.6) % 66) + "%";
    mote.style.setProperty("--drift", ((i % 2 ? -1 : 1) * (8 + (i % 4) * 8)) + "px");
    mote.style.animationDelay = -i * 1.77 + "s";
    mote.style.animationDuration = 5.7 + i % 5 + "s";
    lightDust.append(mote);
  }
  surface.append(moon, lamp, lanternFlame, lightDust);
  picture.append(surface);
  function alignDesk() {
    // app.js sizes this exact background to preserve the clickable journal outline.
    surface.style.width = picture.style.backgroundSize.split(" ")[0] || "100%";
    surface.style.height = picture.style.backgroundSize.split(" ")[1] || "100%";
    const [x,y] = picture.style.backgroundPosition.split(" ");
    surface.style.left = x || "0px";
    surface.style.top = y || "0px";
  }
  alignDesk();
  new MutationObserver(alignDesk).observe(picture, {attributes:true, attributeFilter:["style"]});

  const desk = element("scribes-desk");
  const gleam = element("scribes-desk-gleam");
  const dust = element("scribes-dust");
  for (const [left, top, delay] of [[3,26,1],[6,38,6],[4,65,3],[7,79,8],[96,34,4],[94,54,7],[97,71,2]]) {
    const speck = element("desk-speck", "i");
    speck.style.left = left + "%";
    speck.style.top = top + "%";
    speck.style.animationDelay = -delay + "s";
    dust.append(speck);
  }
  desk.append(gleam, dust);
  document.querySelector("#workshop").prepend(desk);
  const lightWash = element("quill-page-light");
  const pageShadow = element("quill-page-shadow");
  const coverWash = element("quill-cover-light");
  spread.append(pageShadow, lightWash);
  cover.append(coverWash);
  const candle = element("quill-candle");
  const glow = element("quill-candle-halo");
  const cast = element("quill-candle-pool");
  const wax = element("quill-candle-body", "img");
  wax.alt = "";
  wax.src = "./art/enchanted/dragon-chamberstick.webp";
  wax.draggable = false;
  const flame = element("quill-flame-anchor");
  flame.innerHTML = flameArtwork;
  candle.append(cast, glow, wax, flame);
  document.body.append(candle);
  const rim = flame.querySelector(".fire-outer");
  const core = flame.querySelector(".fire-core");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let last = 0;
  function paint(t) {
    const {heat,lean} = flameState(t);
    const tip = 21 + lean, tipY = 23 - 24 * heat + 3 * Math.sin(t * 5.1);
    rim.setAttribute("d",`M21 64 C7 62 10 45 14 34 C17 24 ${tip-1} ${tipY+6} ${tip} ${tipY} C${tip+1.2} 27 ${35+lean*.24} 43 31 54 Q30 65 21 64Z`);
    core.setAttribute("d",`M21 62 C15 59 16 51 19 45 Q${21+lean*.52} 39 ${21+lean*.4} 33 Q23 44 26 51 Q31 61 21 62Z`);
    const level = (.36 + .75 * heat).toFixed(3);
    glow.style.opacity = level;
    glow.style.transform = `translate(-50%,-50%) scale(${(.77+heat*.53).toFixed(3)})`;
    gleam.style.opacity = (.28 + .40 * heat).toFixed(3);
    cast.style.opacity = (.45 + .33 * heat).toFixed(3);
    wax.style.filter = `brightness(${(.85 + .27*heat).toFixed(3)})`;
    lamp.style.opacity = (.12 + heat*.35).toFixed(3);
    lanternFlame.style.transform = `translate(-50%,-85%) skewX(${lean*.8}deg) scaleY(${(.88+heat*.23).toFixed(3)})`;
    coverWash.style.opacity = (.19 + heat*.21).toFixed(3);
    lightWash.style.opacity = (.35 + heat*.54).toFixed(3);
    pageShadow.style.opacity = (.49 - heat*.38).toFixed(3);
  }
  function tick(time) {
    if (time - last >= 45) { paint(time/1000); last = time; }
    frame = requestAnimationFrame(tick);
  }
  function toggle() {
    cancelAnimationFrame(frame);
    const onScene = document.body.classList.contains("at-desk") || document.body.classList.contains("book-open");
    if (reduced.matches || document.hidden || !onScene) paint(0);
    else frame = requestAnimationFrame(tick);
  }
  new MutationObserver(toggle).observe(document.body,{attributes:true,attributeFilter:["class"]});
  reduced.addEventListener("change", toggle);
  document.addEventListener("visibilitychange", toggle);
  toggle();
}
