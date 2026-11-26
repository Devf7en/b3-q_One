export function planProviderOperation(registry,{providerId,tenantId,projectId,capability,operation,resourceRef}={}){
 if(![providerId,tenantId,projectId,capability,resourceRef].every(v=>typeof v==='string'&&v.trim()&&v.length<=256))throw Error('Explicit identifiers required');
 if(!['inspect','propose-change'].includes(operation))throw Error('Unsupported operation');
 const matches=registry.providers.filter(p=>p.id===providerId);
 if(matches.length!==1||!matches[0].candidateCapabilities.includes(capability))throw Error('Unsupported candidate capability');
 return Object.freeze({providerId,tenantId,projectId,capability,operation,resourceRef,state:'simulation',connected:false,executable:false,authorizationRequired:true,approvalRequired:operation==='propose-change',unverified:['provider-availability','account-entitlement','resource-ownership','credentials','cost','policy']});
}
