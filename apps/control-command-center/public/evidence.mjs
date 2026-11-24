export function createEvidenceExplorer({request,document:doc=globalThis.document}={}){
 const section=doc.createElement('section');
 const make=(tag,text)=>{const n=doc.createElement(tag);n.textContent=text;return n;};
 section.setAttribute('aria-label','Infrastructure evidence explorer');
 const status=make('p','Evidence unavailable — authenticated session not configured.');
 status.setAttribute('role','status');
 const list=make('div',''),refresh=make('button','Refresh evidence'),next=make('button','Next observations');
 refresh.type=next.type='button';next.disabled=true;refresh.disabled=typeof request!=='function';
 let cursor=null,sequence=0;
 async function load(after){
 const current=++sequence;refresh.disabled=next.disabled=true;list.replaceChildren();status.textContent='Loading evidence…';
 try{
 const result=await request('/v1/observatory/evidence?limit=25'+(after?'&after='+encodeURIComponent(after):''));
 if(current!==sequence||!section.isConnected)return;
 if(!result||!Array.isArray(result.records)||result.records.length>25)throw Error('Invalid response');
 cursor=typeof result.nextCursor==='string'&&/^[0-9a-f-]{36}$/.test(result.nextCursor)?result.nextCursor:null;
 for(const r of result.records){
 const item=make('article','');item.append(make('h3',String(r.source??'Unknown source')),make('p','State: '+String(r.state??'unavailable')+' | Observed: '+String(r.observedAt??'Unavailable')),make('p','Independent verification: '+(r.verified===true?'Verified':'Not established')),make('p','Resource observations: '+(Array.isArray(r.records)?r.records.length:0)));list.append(item);
 }
 status.textContent=result.records.length?'Evidence retrieved — collector assertions, not independent proof.':'No observations returned — infrastructure health unknown.';
 }catch{if(current!==sequence)return;cursor=null;status.textContent='Evidence unavailable — request failed.';}
 finally{if(current===sequence){refresh.disabled=false;next.disabled=!cursor;}}
 }
 refresh.onclick=()=>load(null);next.onclick=()=>{if(cursor)load(cursor);};
 section.append(make('h2','Infrastructure evidence'),status,refresh,next,list);
 return section;
}
