const upstream = 'https://quill-and-lantern-workshop.neepers.chatgpt.site';
const id = '[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}';
const routes = {
  GET: new RegExp('^(?:me|drafts|teacher(?:/inbox)?|projector(?:/'+id+')?)$','i'),
  POST: new RegExp('^(?:login|logout|(?:submissions|projection-share)/'+id+')$','i'),
  PUT: new RegExp('^(?:drafts|projector)/'+id+'$','i')
};
const sessionPattern = /(?:^|;\s*)(quill_session=[a-f0-9]{64})(?:;|$)/;

export default async function classroom(req, res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  const route = req.query.quillRoute;
  if(typeof route !== 'string' || !routes[req.method]?.test(route)) return res.status(404).json({error:'Page not found.'});
  const write = req.method !== 'GET';
  if(write && (req.headers.origin !== 'https://'+req.headers.host || req.headers['sec-fetch-site']==='cross-site')) {
    return res.status(403).json({error:'Open the classroom to make changes.'});
  }
  const target=new URL('/api/'+route,upstream);
  for(const [key,value] of Object.entries(req.query)) {
    if(key!=='quillRoute' && typeof value==='string') target.searchParams.set(key,value);
  }
  const headers={Accept:'application/json'};
  const cookie=req.headers.cookie?.match(sessionPattern)?.[1];
  if(cookie) headers.Cookie=cookie;
  let body;
  if(write){
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) return res.status(415).json({error:'Use a JSON request.'});
    body=typeof req.body==='string' ? req.body : JSON.stringify(req.body);
    if(!body || Buffer.byteLength(body)>450000) return res.status(400).json({error:'Check the size of the paragraph.'});
    headers['Content-Type']='application/json';
    headers.Origin=upstream;
  }
  try {
    const response=await fetch(target,{method:req.method,headers,body,redirect:'error',signal:AbortSignal.timeout(13000)});
    if(!response.headers.get('content-type')?.includes('application/json')) throw new Error('Unexpected format');
    if(route==='login' || route==='logout'){
      const received=response.headers.get('set-cookie')||'';
      const session=/^quill_session=([a-f0-9]{64}|);[^\r\n]*?Max-Age=(\d+)/i.exec(received);
      if(session) res.setHeader('Set-Cookie','quill_session='+session[1]+'; Path=/; Max-Age='+Number(session[2])+'; HttpOnly; Secure; SameSite=Lax');
    }
    res.setHeader('Content-Type','application/json; charset=utf-8');
    return res.status(response.status).send(await response.text());
  } catch {
    return res.status(502).json({error:'The class notebook could not connect. Please try again.'});
  }
}
