import {classFetch} from './classroom.js';
// Server versions prevent two open notebooks from overwriting one another.
// A tab keeps only pending work and the last open ID for its signed-in owner.
export async function request(path,method='GET',data) {
  const response=await classFetch(''+path,{method,credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(result.error||'The notebook could not connect.'),{status:response.status});
  return result;
}
const key=name=>'quill-journal-v2/'+name;
const stored=name=>{try{return JSON.parse(sessionStorage.getItem(key(name))||'null')}catch{return null}};
const fresh=sceneId=>({id:crypto.randomUUID(),sceneId,text:'',lenses:[],status:'draft',version:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),events:[],dirty:false,revision:0});
const restore=d=>({...d,events:d.events||[],dirty:!!d.dirty,revision:d.revision||0});
export class Notebook {
  constructor(update,notice){this.update=update;this.notice=notice;this.user=null;this.docs=new Map();this.current=null;this.timer=null;this.inflight=null;this.problem='';this.locked=false;}
  get owner(){return this.user?.username||'~practice'}
  get doc(){return this.docs.get(this.current)}
  persist(){const list=[...this.docs.values()].filter(d=>!this.user||d.dirty||(!d.version&&d.id===this.current));try{sessionStorage.setItem(key(this.owner),JSON.stringify({current:this.current,docs:list}));return true}catch{if(!this.warned){this.warned=true;this.notice('This tab cannot keep a recovery copy. Keep the journal open until your writing is saved.')}return false}}
  async load(user){clearTimeout(this.timer);this.user=user;this.problem='';this.docs=new Map();this.warned=false;this.locked=false;const local=stored(this.owner)||{};let server=[];
    if(user)try{server=(await request('drafts')).drafts||[]}catch(e){this.problem='Could not load all saved writing';this.notice('Your notebook could not load. Reopen My writing when the connection returns.')}
    server=server.filter(d=>d.username===user?.username);for(const d of server)this.docs.set(d.id,restore(d));
    for(const d of local.docs||[])if(d.dirty||!this.docs.has(d.id))this.docs.set(d.id,restore(d));
    this.current=this.docs.has(local.current)?local.current:server.find(d=>d.status==='draft')?.id||null;
    if(!this.doc)this.create(1);else this.persist();this.update();if(user)this.queue(700);
  }
  create(scene){const old=this.doc;if(old&&!old.version&&!old.dirty&&!old.text&&!old.lenses.length)this.docs.delete(old.id);const d=fresh(scene);this.docs.set(d.id,d);this.current=d.id;this.persist();this.update();return d}
  open(id){if(this.docs.has(id)){this.current=id;this.persist();this.update()}}
  touch(event){const d=this.doc;if(!d)return;d.revision++;d.dirty=true;d.updatedAt=new Date().toISOString();if(event)d.events.push(event);this.persist();this.queue();}
  queue(delay=850){clearTimeout(this.timer);if(this.user&&!this.locked)this.timer=setTimeout(()=>this.flush(),delay)}
  async flush(){clearTimeout(this.timer);if(!this.user||this.locked)return false;if(this.inflight)return this.inflight;this.inflight=this.sendPending().finally(()=>{this.inflight=null;this.update('status')});return this.inflight}
  async sendPending(){const owner=this.owner;for(const d of this.docs.values()){while(d.dirty&&this.owner===owner){const rev=d.revision;const events=d.events.slice(0,250);const sent={owner,sceneId:d.sceneId,text:d.text,lenses:[...d.lenses],status:d.status,version:d.version,events};
    try{const result=await request('drafts/'+d.id,'PUT',sent);if(this.owner!==owner)return false;d.version=result.draft.version;d.events.splice(0,events.length);d.dirty=d.revision!==rev||d.events.length>0;this.problem='';this.persist();this.update('status')}
    catch(e){if(this.owner!==owner)return false;
      if(e.status===409){let remote;try{remote=((await request('drafts')).drafts||[]).find(x=>x.id===d.id&&x.username===owner)}catch{}if(!remote){this.problem='Could not compare saved copies';this.update('status');return false}
        if(remote.text===sent.text&&remote.status===sent.status&&JSON.stringify(remote.lenses)===JSON.stringify(sent.lenses)){d.version=remote.version;d.events.splice(0,events.length);d.dirty=d.revision!==rev||d.events.length>0;this.persist();continue}
        const oldId=d.id;d.id=crypto.randomUUID();d.version=0;d.sharedVersion=null;d.sharedText=null;d.sharedLenses=[];d.createdAt=new Date().toISOString();this.docs.set(oldId,restore(remote));this.docs.set(d.id,d);if(this.current===oldId)this.current=d.id;this.persist();this.notice('Another device changed this paragraph. Both copies are in My writing.');continue;
      }
      if(e.status===401||e.status===403){this.locked=true;this.problem='Sign in again to save';this.notice('Your sign-in changed. This tab kept your edits for your account.')}
      else {this.problem='Waiting to sync';if(e.status===undefined||e.status>=500)this.queue(7000);else this.notice('Your writing is in this tab. The server could not save it yet.')}
      this.persist();this.update('status');return false;
    }
  }}return true}
  discardDeviceCopy(){try{sessionStorage.removeItem(key(this.owner))}catch{}}
  async refresh(){if(!this.user)return;const owner=this.owner;try{const data=await request('drafts');if(this.owner!==owner)return;for(const d of data.drafts||[]){if(d.username!==owner)continue;const local=this.docs.get(d.id);if(!local||(!local.dirty&&d.version>=local.version))this.docs.set(d.id,restore(d))}this.problem='';this.update()}catch{this.notice('Could not refresh the notebook. Your open work is still here.')}}
}
