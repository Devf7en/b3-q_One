import {evidenceFreshness} from '../audit-evidence/index.mjs';
import {authorize} from '../runtime-policy/index.mjs';
import {randomUUID} from 'node:crypto';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const reply=(status,body)=>({status,body});
export function createGateway({authenticate,transaction,governance}){
 if(typeof authenticate!=='function'||typeof transaction!=='function'||typeof governance?.create!=='function'||typeof governance?.approve!=='function')throw Error('Trusted dependencies required');
 return async ({method,path,token,tenantId,body}={})=>{
 const [route,query,...extra]=String(path??'').split('?');
 const match=/^\/v1\/(control|observatory)\/(projects|plans|evidence)(?:\/([0-9a-f-]+)\/approve)?$/.exec(route);
 if(!match)return reply(404,{error:'Not found'});
 const [,surface,collection,id]=match;
 const params=new URLSearchParams(query);
 if(extra.length||(query!==undefined&&(collection!=='evidence'||method!=='GET'||id||[...params.keys()].some(k=>!['limit','after'].includes(k))||params.getAll('limit').length>1||params.getAll('after').length>1)))return reply(400,{error:'Invalid query'});
 const limitText=params.get('limit')??'100',after=params.get('after');
 if(!/^[1-9][0-9]{0,2}$/.test(limitText)||Number(limitText)>100||(after!==null&&!uuid.test(after)))return reply(400,{error:'Invalid pagination'});
 const limit=Number(limitText);
 const read=method==='GET'&&!id,create=method==='POST'&&collection==='plans'&&!id,approve=method==='POST'&&collection==='plans'&&uuid.test(id??'');
 if(!read&&!create&&!approve)return reply(405,{error:'Method not allowed'});
 if(typeof token!=='string'||!token||token.length>8192)return reply(401,{error:'Authentication required'});
 if(!uuid.test(tenantId??''))return reply(400,{error:'Invalid tenant'});
 let principal;try{principal=await authenticate(token,tenantId);}catch{return reply(401,{error:'Authentication required'});}
 if(!principal||principal.tenantId!==tenantId)return reply(403,{error:'Access denied'});
 const context={token,tenantId};
 if(!read){
 if(surface!=='control'||principal.role!==(create?'operator':'approver'))return reply(403,{error:'Access denied'});
 if(!body||Object.getPrototypeOf(body)!==Object.prototype)return reply(400,{error:'Invalid body'});
 const keys=create?['projectId','manifest']:['version','expectedDigest'];
 if(Object.keys(body).some(k=>!keys.includes(k)))return reply(400,{error:'Invalid fields'});
 if(create&&(!uuid.test(body.projectId??'')||!body.manifest||Object.getPrototypeOf(body.manifest)!==Object.prototype))return reply(400,{error:'Invalid plan'});
 if(approve&&(!Number.isSafeInteger(body.version)||body.version<1||!/^[a-f0-9]{64}$/.test(body.expectedDigest??'')))return reply(400,{error:'Invalid approval'});
 try{
 const record=create?await governance.create(context,{projectId:body.projectId,id:randomUUID(),version:1,manifest:body.manifest,surface}):await governance.approve(context,{id,version:body.version,expectedDigest:body.expectedDigest,surface});
 return reply(201,{record,executable:false});
 }catch{return reply(409,{error:'Governance request not completed'});}
 }
 try{return await transaction(context,async(client,verified)=>{
 if(!authorize({principal:verified,resource:{tenantId},action:collection==='evidence'?'evidence.read':collection==='projects'?'project.read':'plan.read',surface}))return reply(403,{error:'Access denied'});
 if(collection==='evidence'){
 if(after){const anchor=await client.query('SELECT id FROM one_runtime.evidence WHERE tenant_id=$1 AND id=$2',[tenantId,after]);if(!anchor.rows.length)return reply(400,{error:'Invalid cursor'});}
 const {rows}=await client.query("SELECT e.id,e.project_id,e.source,e.observed_at,e.state,e.payload FROM one_runtime.evidence e WHERE e.tenant_id=$1 AND ($2::uuid IS NULL OR EXISTS (SELECT 1 FROM one_runtime.evidence a WHERE a.tenant_id=$1 AND a.id=$2 AND (COALESCE(e.observed_at,'-infinity'::timestamptz)<COALESCE(a.observed_at,'-infinity'::timestamptz) OR (COALESCE(e.observed_at,'-infinity'::timestamptz)=COALESCE(a.observed_at,'-infinity'::timestamptz) AND e.id>a.id)))) ORDER BY e.observed_at DESC NULLS LAST,e.id LIMIT $3",[tenantId,after,limit+1]);
 const now=new Date().toISOString();
 return reply(200,{records:rows.slice(0,limit).map(r=>{const observedAt=r.observed_at?new Date(r.observed_at).toISOString():null;const freshness=evidenceFreshness({source:r.source,observedAt,state:r.state},{now,maxAgeMs:300000});return {id:r.id,projectId:r.project_id,source:r.source,observedAt,...freshness,state:freshness.freshness==='stale'?'cached':freshness.state,records:Array.isArray(r.payload?.records)?r.payload.records:[]};}),truncated:rows.length>limit,nextCursor:rows.length>limit?rows[limit-1].id:null});
 }
 const sql=collection==='projects'?'SELECT id,name FROM one_runtime.projects WHERE tenant_id=$1 ORDER BY id LIMIT 100':'SELECT id,version,project_id,digest FROM one_runtime.plans WHERE tenant_id=$1 ORDER BY id,version LIMIT 100';
 return reply(200,{records:(await client.query(sql,[tenantId])).rows});
 });}catch{return reply(503,{error:'Request unavailable'});}
 };
}
