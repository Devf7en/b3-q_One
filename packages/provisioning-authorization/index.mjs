// Read-only authorization assessment. No execution adapter or credential handling.
// The inspector must be the server-side authenticated governance records boundary.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createProvisioningAuthorization({inspect}={}){
 if(typeof inspect!=='function')throw Error('Authenticated governance inspector required');
 return Object.freeze({
  async assess({token,tenantId,requestId,operation,target}={}){
   if(!uuid.test(tenantId??'')||!uuid.test(requestId??'')||
      typeof operation!=='string'||!operation.trim()||
      typeof target!=='string'||!target.trim())throw Error('Invalid authorization request');
   try {
    const evidence=await inspect({token,tenantId,requestId});
    const valid=evidence?.id===requestId&&evidence?.status==='approved'&&
      evidence?.consistent===true&&evidence?.operation===operation&&
      evidence?.target===target&&evidence?.unexpired===true&&
      Array.isArray(evidence?.blockers)&&evidence.blockers.length===0;
    return {authorized:valid,executable:false,
      blockers:valid?[]:['governance-authorization-denied']};
   } catch {
    return {authorized:false,executable:false,blockers:['governance-evidence-unavailable']};
   }
  }
 });
}
