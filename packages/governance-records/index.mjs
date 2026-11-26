// Server-side governance persistence boundary. No execution adapter is exposed.
// All queries run inside the authenticated tenant-scoped data-runtime transaction.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validId=x=>typeof x==='string'&&uuid.test(x);
export function createGovernanceRecords({transaction}){
 if(typeof transaction!=='function')throw Error('Authenticated transaction required');
 return Object.freeze({
  async register({token,tenantId,requestId,operation,target,reason}){
   if(!validId(tenantId)||!validId(requestId)||![operation,target,reason].every(x=>typeof x==='string'&&x.trim()&&x.length<=512))throw Error('Invalid request');
   return transaction({token,tenantId},async(client,principal)=>{
    if(principal.role!=='operator')throw Error('Forbidden');
    const {rows}=await client.query(
     'INSERT INTO one_runtime.governance_requests (tenant_id,id,operation,target,reason,requested_by,status) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (tenant_id,id) DO NOTHING RETURNING id,status',
     [tenantId,requestId,operation,target,reason,principal.userId,'pending']);
    if(rows.length!==1)throw Error('Duplicate request');
    await client.query('INSERT INTO one_runtime.governance_audit (tenant_id,request_id,actor_id,event) VALUES ($1,$2,$3,$4)',[tenantId,requestId,principal.userId,'registered']);
    return {id:requestId,status:'pending',executable:false};
   });
  },
  async decide({token,tenantId,requestId,decision}){
   if(!validId(tenantId)||!validId(requestId)||!['approved','rejected'].includes(decision))throw Error('Invalid decision');
   return transaction({token,tenantId},async(client,principal)=>{
    if(principal.role!=='approver')throw Error('Forbidden');
    const {rows}=await client.query(
     "UPDATE one_runtime.governance_requests SET status=$1,decided_by=$2,decided_at=NOW() WHERE tenant_id=$3 AND id=$4 AND status='pending' AND expires_at>NOW() AND requested_by<>$2 RETURNING id,status",
     [decision,principal.userId,tenantId,requestId]);
    if(rows.length!==1)throw Error('Not pending or self-approval prohibited');
    await client.query('INSERT INTO one_runtime.governance_audit (tenant_id,request_id,actor_id,event) VALUES ($1,$2,$3,$4)',[tenantId,requestId,principal.userId,decision]);
    return {id:requestId,status:decision,executable:false};
   });
  },
  async expire({token,tenantId,requestId}){
   if(!validId(tenantId)||!validId(requestId))throw Error('Invalid request');
   return transaction({token,tenantId},async(client,principal)=>{
    if(!['operator','approver'].includes(principal.role))throw Error('Forbidden');
    const {rows}=await client.query(
     "UPDATE one_runtime.governance_requests SET status='expired',decided_at=NOW() WHERE tenant_id=$1 AND id=$2 AND status='pending' AND expires_at<=NOW() RETURNING id,status",
     [tenantId,requestId]);
    if(rows.length!==1)throw Error('Not expired or no pending request');
    await client.query('INSERT INTO one_runtime.governance_audit (tenant_id,request_id,actor_id,event) VALUES ($1,$2,$3,$4)',[tenantId,requestId,principal.userId,'expired']);
    return {id:requestId,status:'expired',executable:false};
   });
  }
 });
}
