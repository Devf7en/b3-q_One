// Demonstration planner only. No shell, credentials, or execution authority.
const operations=Object.freeze({
 'repository.inspect':{risk:'read',args:['repository']},
 'container.inspect':{risk:'read',args:['resource']},
 'process.inspect':{risk:'read',args:['resource']},
 'service.restart':{risk:'change',args:['resource']},
 'deployment.rollback':{risk:'high',args:['resource','revision']}
});
export function planCommand({operation,target,parameters={},workspaceId}={}){
 if(!['W09','W11'].includes(workspaceId))throw Error('Unsupported workspace');
 if(!Object.hasOwn(operations,operation))throw Error('Unsupported operation');
 if(typeof target!=='string'||!target.trim()||target.length>256)throw Error('Explicit target required');
 const spec=operations[operation];
 if(!parameters||typeof parameters!=='object'||Array.isArray(parameters)||Object.keys(parameters).some(k=>!spec.args.includes(k)))throw Error('Unexpected parameters');
 for(const k of spec.args)if(typeof parameters[k]!=='string'||!parameters[k].trim()||parameters[k].length>256)throw Error('Missing or invalid parameter');
 return {operation,target,parameters:{...parameters},workspaceId,risk:spec.risk,approvalRequired:spec.risk!=='read',authorizationRequired:true,executable:false,state:'demonstration',reason:'No authenticated execution adapter configured'};
}
export function listOperations(){return Object.entries(operations).map(([id,s])=>({id,risk:s.risk,args:[...s.args]}));}
