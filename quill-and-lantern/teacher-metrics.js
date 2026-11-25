const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit"
});
const wordPattern = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;
const segmenter = globalThis.Intl?.Segmenter ? new Intl.Segmenter("en", {granularity: "sentence"}) : null;
export const isFinished = d => d.status === "finished";
export const mean = nums => nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
export const words = text => String(text || "").match(wordPattern) || [];
export function bangkokDay(input = new Date()) {
  const date = new Date(input);
  if (!Number.isFinite(date.valueOf())) return "";
  const parts = Object.fromEntries(dayFormat.formatToParts(date).map(p => [p.type,p.value]));
  return [parts.year,parts.month,parts.day].join("-");
}
export function shiftDay(day, offset) {
  const d = new Date(day+"T12:00:00Z");
  d.setUTCDate(d.getUTCDate()+offset);
  return d.toISOString().slice(0,10);
}
export function monday(day) {
  return shiftDay(day,-((new Date(day+"T12:00:00Z").getUTCDay()+6)%7));
}
export function since(range,today) {
  if (range === "week") return monday(today);
  if (range === "7" || range === "30") return shiftDay(today,1-Number(range));
  return "";
}
export function textMeasures(text) {
  const source = String(text || "");
  const parts = segmenter ? [...segmenter.segment(source)].map(s=>s.segment) : source.match(/[^.!?\n]+[.!?]*|[^.!?\n]+$/g) || [];
  const sentences = parts.filter(s=>words(s).length>0);
  const openings = sentences.map(s => words(s).slice(0,2).join(" ").toLowerCase().replaceAll("’","'")).filter(s => s.includes(" "));
  return {wordCount:words(source).length,sentenceCount:sentences.length,openings};
}
export function enrich(d, sceneMap) {
  const a = d.analytics || {};
  const days = new Set((Array.isArray(a.days) ? a.days : []).filter(day=>/^\d{4}-\d{2}-\d{2}$/.test(day)));
  for (const dt of [d.createdAt,d.updatedAt,a.firstFinishedAt]) if (dt && bangkokDay(dt)) days.add(bangkokDay(dt));
  const scene = sceneMap.get(Number(d.sceneId)) || {title:"Archived scene",genre:"Other",prompt:""};
  const starters = Object.entries(a.starters || {}).filter(([,v]) => Number.isSafeInteger(v?.count) && v.count>0 && [0,1,2].includes(v.tier));
  return {...d, scene, ...textMeasures(d.text), activeDays: [...days].sort(), lastDay:bangkokDay(d.updatedAt), starters,
    hints:Number.isSafeInteger(a.hints) && a.hints>0 ? a.hints : 0, checkpoints:(a.snapshots || []).filter(s=>typeof s.text==="string").slice().sort((x,y)=>String(x.at).localeCompare(String(y.at)))};
}
export function selectDrafts(drafts,filters,today) {
  const from = since(filters.range,today);
  return drafts.filter(d => (!from || (d.lastDay>=from && d.lastDay<=today)) &&
    (!filters.student || d.username===filters.student) && (!filters.genre || d.scene.genre===filters.genre) &&
    (!filters.status || (isFinished(d) ? "finished" : "draft")===filters.status));
}
export function rank(map) {
  return [...map.entries()].sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
}
export function summary(drafts) {
  const phraseCounts = new Map(), openings = new Map(), lensCounts = new Map(), lensPieces = new Map();
  const tiers=[0,0,0], authors=new Set();
  let insertions=0,hints=0,annotated=0,withOpenings=0,openingCount=0;
  for (const d of drafts) {
    authors.add(d.username); hints+=d.hints;
    if (d.starters.length) annotated++;
    if (d.openings.length) withOpenings++;
    openingCount+=d.openings.length;
    for (const item of d.openings) openings.set(item,(openings.get(item)||0)+1);
    const usedLenses = new Set();
    for (const [phrase,v] of d.starters) {
      insertions+=v.count; tiers[v.tier]+=v.count;
      lensCounts.set(v.lens,(lensCounts.get(v.lens)||0)+v.count);
      phraseCounts.set(phrase,(phraseCounts.get(phrase)||0)+v.count);
      usedLenses.add(v.lens);
    }
    for (const lens of usedLenses) lensPieces.set(lens,(lensPieces.get(lens)||0)+1);
  }
  const finished=drafts.filter(isFinished);
  return {finished,authors,insertions,phraseCounts,openings,lensCounts,lensPieces,tiers,hints,annotated,withOpenings,openingCount,
    withHints:drafts.filter(d=>d.hints>0).length,
    meanWords:mean(finished.map(d=>d.wordCount)),meanSentences:mean(finished.map(d=>d.sentenceCount))};
}
export function trend(drafts) {
  const sorted=drafts.filter(isFinished).sort((a,b)=>String(a.analytics?.firstFinishedAt||a.updatedAt).localeCompare(String(b.analytics?.firstFinishedAt||b.updatedAt)) || String(a.id).localeCompare(String(b.id)));
  const n=Math.min(3,Math.floor(sorted.length/2));
  if (!n) return null;
  const profile=items=>({words:mean(items.map(d=>d.wordCount)),sentences:mean(items.map(d=>d.sentenceCount))});
  return {n,early:profile(sorted.slice(0,n)),recent:profile(sorted.slice(-n))};
}
export function weekActivity(drafts,range,today) {
  const min=since(range,today);
  const weekly=new Map();
  const get=day=>{
    const start=monday(day);
    if (!weekly.has(start)) weekly.set(start,{start,authors:new Set(),pieces:new Set(),finishes:0});
    return weekly.get(start);
  };
  for (const d of drafts) {
    for (const day of d.activeDays) {
      if (!day || day < min || day>today) continue;
      const week=get(day);
      week.authors.add(d.username); week.pieces.add(d.id);
    }
    const firstFinish=d.analytics?.firstFinishedAt && bangkokDay(d.analytics.firstFinishedAt);
    if (firstFinish && firstFinish>=min && firstFinish<=today) get(firstFinish).finishes++;
  }
  // Include quiet weeks between the first selected writing day and today.
  const keys=[...weekly.keys()].sort();
  const start=min ? monday(min) : keys[0];
  if (start) for (let day=start;day<=today;day=shiftDay(day,7)) get(day);
  return [...weekly.values()].sort((a,b)=>a.start.localeCompare(b.start));
}
export function comparison(d) {
  const firstFinish=d.analytics?.firstFinishedAt;
  const first = firstFinish ? d.checkpoints.find(s=>s.at===firstFinish) ||
    d.checkpoints.find(s=>s.reason==="first_finish" || s.reason==="first-finish" || s.reason==="first-finished" || s.status==="finished") : null;
  const before = first || d.checkpoints[0];
  return before ? {label:first?"First finish":"First available checkpoint",before,measures:textMeasures(before.text)} : null;
}
export function csvValue(value) {
  let str=String(value??"");
  if (/^[\s\uFEFF]*[=+\-@]/.test(str) || /^[\t\r\n]/.test(str)) str="'"+str;
  return '"'+str.replaceAll('"','""')+'"';
}
