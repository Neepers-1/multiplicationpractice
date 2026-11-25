// Each entry follows its genre's original sequence in content.js. The motion
// describes what actually happens to the painted subject in that little scene.
const staging = {
  Scary: [
    ['window','scratch','moon'], ['street','beckon','moon'], ['hall','step','dust'],
    ['desk','return','dust'], ['field','swing','breeze'], ['room','knock','dust'],
    ['street','brake','mist'], ['kitchen','twitch','dust'], ['room','prints','drips'],
    ['washroom','turn','shine'], ['station','open','mist'], ['closet','swing','dust'],
    ['camp','unzip','moon'], ['water','swim','lights'], ['desk','whisper','dust'],
    ['street','tilt','uprain'], ['stage','reach','dust'], ['lake','float','signals'],
    ['room','twitch','rain'], ['gallery','turn','dust'], ['hall','chime','lamps'],
    ['room','flutter','moon'], ['castle','breathe','echo'], ['baggage','conveyor','dust'],
    ['hall','quiver','lamps']
  ],
  Silly: [
    ['kitchen','escape','crumbs'], ['classroom','tap','dust'], ['desk','march','dust'],
    ['stage','sneeze','glitter'], ['kitchen','curl','steam'], ['field','ducks','breeze'],
    ['street','coast','dust'], ['closet','talk','dust'], ['classroom','invert','glitter'],
    ['kitchen','boom','echo'], ['kitchen','ring','shine'], ['classroom','scribble','dust'],
    ['room','flutterBy','feathers'], ['classroom','giggle','glitter'], ['stage','sneeze','echo'],
    ['field','drift','breeze'], ['kitchen','twitch','candle'], ['kitchen','clap','crumbs'],
    ['classroom','hop','dust'], ['street','hop','rain'], ['field','pause','breeze'],
    ['classroom','hiccup','glitter'], ['ballpark','fly','breeze'], ['field','sprint','dust'],
    ['stage','bow','dust']
  ],
  Fantasy: [
    ['desk','hiccup','embers'], ['orchard','plummet','moon'], ['desk','bob','ripple'],
    ['valley','thread','drips'], ['kitchen','cloud','rain'], ['valley','drift','shine'],
    ['beach','unlock','shine'], ['desk','grow','leaves'], ['valley','unwind','glitter'],
    ['field','breathe','echo'], ['desk','flutter','petals'], ['water','swim','bubbles'],
    ['castle','listen','dust'], ['classroom','fly','leaves'], ['river','rise','ripple'],
    ['field','quiver','drips'], ['street','salute','shine'], ['desk','return','signals'],
    ['street','drift','breeze'], ['river','bound','pawprints'], ['beach','crack','ripple'],
    ['forest','float','fireflydoor'], ['river','bob','ripple'], ['orchard','step','leaves'],
    ['desk','reach','embers']
  ],
  Gross: [
    ['kitchen','breathe','bubbles'], ['garden','crawl','slime'], ['pantry','tilt','motes'],
    ['closet','swing','drips'], ['kitchen','swell','bubbles'], ['pantry','stir','steam'],
    ['kitchen','curl','slime'], ['garden','peek','leaves'], ['field','swell','seeds'],
    ['field','tilt','drips'], ['garden','march','leaves'], ['classroom','ooze','slime'],
    ['washroom','shake','drips'], ['moon','step','bubbles'], ['classroom','hiccup','drips'],
    ['desk','squirt','steam'], ['garden','tilt','drips'], ['field','roll','leaves'],
    ['room','hop','dust'], ['street','tilt','rain'], ['garden','crawl','slime'],
    ['kitchen','breathe','mist'], ['street','step','steam'], ['garden','bound','slime'],
    ['garden','chorus','bubbles']
  ]
};

const root = './art/scenery/';
const specialPlates = {window: './art/window.webp', forest: './art/scary.webp', valley: './art/fantasy.webp'};
const mounted = new WeakMap();
function element(tag, css) {
  const el = document.createElement(tag);
  el.className = css;
  return el;
}
const imageReady=new Map();
function loadImage(src) {
  if (!imageReady.has(src)) {
    const img=new Image();
    img.src=src;
    imageReady.set(src,img.decode().catch(() => { imageReady.delete(src); }));
  }
  return imageReady.get(src);
}
const visibility=typeof IntersectionObserver!=='undefined' ? new IntersectionObserver(entries=>{
  for(const {target,isIntersecting} of entries) {
    target.classList.toggle('sc-resting',!isIntersecting);
    if(!target.isConnected)visibility.unobserve(target);
  }
}) : null;
function subject(layer, scene, motion) {
  const counts = {ducks:5, march:3, prints:4, swim:scene.title==='Night at the Aquarium'?3:1, chorus:3};
  const count = counts[motion] || 1;
  for (let index=0; index<count; index++) {
    const track=element('div','sc-actor sc-actor-'+motion);
    track.style.setProperty('--i',String(index));
    // Vary the pace of members of a flock and stagger their footprints.
    track.style.setProperty('--behind',(-index*1.33)+'s');
    track.style.setProperty('--gait',(-index*.17)+'s');
    if (motion==='ducks') {
      track.append(element('span','sc-walking-duck'));
    } else {
      const sprite=element('img','sc-subject');
      sprite.alt='';
      sprite.src=root+'scene-'+scene.id+'.webp';
      sprite.draggable=false;
      track.append(sprite);
    }
    layer.append(track);
  }
}
function atmosphere(layer, mood) {
  const field=element('div','sc-air sc-air-'+mood);
  const total=mood==='fireflydoor'?19:mood==='pawprints'?6:7;
  for (let i=0;i<total;i++) {
    const speck=element('i','sc-detail');
    const fraction=i/(total-1);
    const x=mood==='fireflydoor' ? (fraction<.3?51: fraction>.7?86:51+(fraction-.3)/.4*35)
      : mood==='pawprints'?55+i*6:36+((i*19+8)%68);
    const y=mood==='fireflydoor' ? (fraction<.3?74-fraction/.3*51:fraction>.7?23+(fraction-.7)/.3*51:23-Math.sin((fraction-.3)/.4*Math.PI)*9)
      : mood==='pawprints' ? 73-Math.sin(i*.7)*9:13+(i*23)%78;
    speck.style.cssText='--x:'+x+'%;--y:'+y+'%;--start:'+(-i*.92)+'s;--tilt:'+(i%2?25:-18)+'deg;--tempo:'+(3+(i%4)*.55)+'s';
    field.append(speck);
  }
  layer.append(field);
}

/** Mount one illustrated vignette inside the background of the scene heading. */
export function renderScenery(heroElement, scene) {
  if(!heroElement)return;
  heroElement.classList.add('has-living-scene');
  return mountScene(heroElement.querySelector('.hero-art'), scene, false);
}
export function renderSceneryPreview(container,scene){
  return mountScene(container,scene,true);
}
function mountScene(heroArt,scene,compact) {
  const index=Math.floor((scene.id-1)/4);
  const settings=staging[scene.genre]?.[index];
  if (!heroArt || !settings) return;
  const previous=mounted.get(heroArt);
  if (previous?.id===scene.id) return previous.dispose;
  const [plate,motion,air]=settings;
  const stage=element('div','sc-stage'+(compact?' sc-mini':''));
  stage.setAttribute('aria-hidden','true');
  const background=element('div','sc-plate');
  const location=specialPlates[plate] || root+plate+'.webp';
  background.style.backgroundImage='url("'+location+'")';
  stage.append(background);
  subject(stage,scene,motion);
  atmosphere(stage,air);
  heroArt.append(stage);
  visibility?.observe(stage);
  const dispose=()=>{
    visibility?.unobserve(stage);
    stage.remove();
    if(mounted.get(heroArt)?.stage===stage)mounted.delete(heroArt);
  };
  mounted.set(heroArt,{id:scene.id,stage,dispose});
  const actor=motion==='ducks'?root+'duck-walk.webp':root+'scene-'+scene.id+'.webp';
  Promise.all([loadImage(location),loadImage(actor)]).then(()=>{
    if(mounted.get(heroArt)?.stage!==stage){stage.remove();return}
    requestAnimationFrame(()=>{
      if(mounted.get(heroArt)?.stage!==stage)return;
      stage.classList.add('sc-visible');
      // Leave the old picture underneath until the new illustration is opaque.
      window.setTimeout(()=>{if(mounted.get(heroArt)?.stage===stage)for(const old of heroArt.querySelectorAll('.sc-stage'))if(old!==stage){visibility?.unobserve(old);old.remove()}},650);
    });
  });
  return dispose;
}
