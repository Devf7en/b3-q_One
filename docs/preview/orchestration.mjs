export function planWorkflow(steps){
 if(!Array.isArray(steps)||!steps.length)throw Error('Steps required');
 const map=new Map();for(const s of steps){if(typeof s.id!=='string'||!s.id.trim()||map.has(s.id)||!Array.isArray(s.dependsOn)||!['read','change'].includes(s.kind))throw Error('Invalid step');map.set(s.id,s);}
 const ordered=[],done=new Set();while(ordered.length<steps.length){const ready=steps.filter(s=>!done.has(s.id)&&s.dependsOn.every(d=>done.has(d)));if(!ready.length)throw Error('Cycle or unknown dependency');for(const s of ready){done.add(s.id);ordered.push({id:s.id,approvalRequired:s.kind==='change'});}}
 return {steps:ordered,state:'simulation',executable:false};
}
export function planDelegation({agent,task,model,allowedModels,budget,estimatedCost,permissions,requiredPermissions}){
 if(![agent,task,model].every(x=>typeof x==='string'&&x.trim()))throw Error('Explicit agent, task and model required');
 if(![allowedModels,permissions,requiredPermissions].every(Array.isArray)||!Number.isSafeInteger(budget)||!Number.isSafeInteger(estimatedCost)||budget<0||estimatedCost<0)throw Error('Invalid policy inputs');
 const blockers=[];if(!allowedModels.includes(model))blockers.push('model');if(estimatedCost>budget)blockers.push('budget');if(!requiredPermissions.every(p=>permissions.includes(p)))blockers.push('permissions');
 return {agent,task,model,estimatedCost,budget,unit:'micro-USD',blockers,decision:blockers.length?'blocked':'eligible-for-review',approvalRequired:true,executable:false,state:'simulation'};
}
