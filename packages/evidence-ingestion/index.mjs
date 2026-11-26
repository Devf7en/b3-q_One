import {randomUUID} from 'node:crypto';
import {normalizeInventory} from '../infrastructure-evidence/index.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function createEvidenceIngestion({pool,verifyToken,issuer,audience,clock=()=>new Date().toISOString()}){
 if(typeof pool?.connect!=='function'||typeof verifyToken!=='function'||!issuer||!audience)throw Error('Trusted ingestion dependencies required');
 return async ({token,tenantId,projectId,submissionId,snapshot})=>{
 if(![tenantId,projectId,submissionId].every(v=>typeof v==='string'&&uuid.test(v)))throw Error('Invalid identifiers');
 const claims=await verifyToken(token,{issuer,audience});
 if(claims?.iss!==issuer||typeof claims.sub!=='string'||!claims.sub)throw Error('Unauthorized collector');
 const client=await pool.connect();let discard=false;
 try{
 await client.query('BEGIN');
 await client.query("SELECT set_config('one.tenant_id',$1,true)",[tenantId]);
 const {rows}=await client.query('SELECT * FROM one_runtime.resolve_collector_assignments($1,$2,$3,$4)',[issuer,claims.sub,tenantId,projectId]);
 if(!rows.length)throw Error('Collector not authorized for project');
 const {host_id:hostId,collector_id:collectorId}=rows[0];
 const assignments=rows.map(r=>({hostId:r.host_id,kind:r.kind,ref:r.external_ref,resourceId:r.resource_id,tenantId,projectId}));
 const evidence=normalizeInventory({snapshot,hostId,tenantId,projectId,assignments,now:clock()});
 if(!assignments.some(a=>evidence.source==='docker-cli:'+a.kind))throw Error('Unauthorized inventory kind');
 const id=randomUUID();
 await client.query('INSERT INTO one_runtime.evidence(tenant_id,id,project_id,source,observed_at,state,payload) VALUES ($1,$2,$3,$4,$5,$6,$7)',[tenantId,id,projectId,evidence.source,evidence.observed_at,evidence.state,JSON.stringify({...evidence,collectorId,submissionId})]);
 await client.query('COMMIT');
 return {id,state:evidence.state,recordCount:evidence.records.length,executable:false};
 }catch(e){try{await client.query('ROLLBACK');}catch{discard=true;}throw e;}finally{client.release(discard);}
 };
}
