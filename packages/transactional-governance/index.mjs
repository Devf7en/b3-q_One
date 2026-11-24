import {randomUUID} from 'node:crypto';
import {createPlan,approvePlan} from '../governance-ledger/index.mjs';
import {auditEvent,verifyEvent} from '../audit-evidence/index.mjs';
// Trusted server callers only. All writes share the data runtime transaction.
export function createGovernanceService({transaction,clock=()=>new Date().toISOString()}){
 if(typeof transaction!=='function')throw Error('Transaction required');
 async function append(client,principal,action,digest,correlationId){
 const result=await client.query("SELECT details FROM one_runtime.audit_events WHERE tenant_id=$1 ORDER BY (details->>'sequence')::bigint DESC LIMIT 1",[principal.tenantId]);
 const previous=result.rows[0]?.details??null;
 if(previous&&!verifyEvent(previous))throw Error('Invalid audit head');
 const event=auditEvent({principal,id:randomUUID(),action,correlationId,planDigest:digest,outcome:'completed',recordedAt:clock(),previous});
 await client.query('INSERT INTO one_runtime.audit_events(tenant_id,id,actor_id,action,details,recorded_at) VALUES ($1,$2,$3,$4,$5,$6)',[event.tenantId,event.id,event.actorId,event.action,JSON.stringify(event),event.recordedAt]);
 }
 async function lock(client,principal){await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[principal.tenantId]);}
 return {
 create:(context,{projectId,id,version,manifest,surface})=>transaction(context,async(client,principal)=>{
 await lock(client,principal);
 const q=await client.query('SELECT id FROM one_runtime.projects WHERE tenant_id=$1 AND id=$2',[principal.tenantId,projectId]);
 if(q.rows.length!==1)throw Error('Project unavailable');
 const plan=createPlan({principal,project:{tenantId:principal.tenantId,id:q.rows[0].id},id,version,manifest,surface});
 await client.query('INSERT INTO one_runtime.plans(tenant_id,id,version,project_id,created_by,manifest,digest) VALUES ($1,$2,$3,$4,$5,$6,$7)',[plan.tenantId,plan.id,plan.version,plan.projectId,plan.createdBy,JSON.stringify(plan.manifest),plan.digest]);
 await append(client,principal,'plan.create',plan.digest,randomUUID());
 return plan;
 }),
 approve:(context,{id,version,expectedDigest,surface})=>transaction(context,async(client,principal)=>{
 await lock(client,principal);
 const q=await client.query('SELECT tenant_id,id,version,project_id,created_by,manifest,digest FROM one_runtime.plans WHERE tenant_id=$1 AND id=$2 AND version=$3',[principal.tenantId,id,version]);
 if(q.rows.length!==1)throw Error('Plan unavailable');
 const p=q.rows[0];
 const plan={format:'one-plan-v1',tenantId:p.tenant_id,id:p.id,version:p.version,projectId:p.project_id,createdBy:p.created_by,manifest:p.manifest,digest:p.digest};
 const approval=approvePlan({principal,plan,expectedDigest,surface});
 await client.query('INSERT INTO one_runtime.approvals(tenant_id,plan_id,version,digest,created_by,approved_by) VALUES ($1,$2,$3,$4,$5,$6)',[approval.tenantId,approval.planId,approval.version,approval.digest,approval.createdBy,approval.approvedBy]);
 await append(client,principal,'plan.approve',approval.digest,randomUUID());
 return approval;
 })
 };
}
