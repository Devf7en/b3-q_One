// Pure planning state machine. No execution or external dispatch.
const transitions={draft:['review'],review:['approved','rejected'],approved:['cancelled'],rejected:[],cancelled:[]};
export function createJob({tenantId,id,planDigest,idempotencyKey}){
 if(![tenantId,id,idempotencyKey].every(v=>typeof v==='string'&&v.trim()&&v.length<=256)||typeof planDigest!=='string'||!/^[a-f0-9]{64}$/.test(planDigest))throw Error('Invalid job identity');
 return Object.freeze({tenantId,id,planDigest,idempotencyKey,state:'draft',revision:0,executable:false});
}
export function transitionJob(job,next,{expectedRevision,approval}={}){
 if(!job||job.executable!==false||job.revision!==expectedRevision||!transitions[job.state]?.includes(next))throw Error('Invalid transition');
 if(next==='approved'&&(!approval||approval.tenantId!==job.tenantId||approval.digest!==job.planDigest||approval.executable!==false||!approval.approvedBy||!approval.createdBy||approval.approvedBy===approval.createdBy))throw Error('Independent approval required');
 return Object.freeze({...job,state:next,revision:job.revision+1,executable:false});
}
