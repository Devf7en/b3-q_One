import test from 'node:test';
import assert from 'node:assert/strict';
import {createProvisioningAuthorization} from '../packages/provisioning-authorization/index.mjs';
const tenantId='00000000-0000-0000-0000-000000000001';
const requestId='00000000-0000-0000-0000-000000000003';
const input={token:'test',tenantId,requestId,operation:'service.restart',target:'staging'};
const approved={id:requestId,status:'approved',operation:'service.restart',target:'staging',unexpired:true,consistent:true,blockers:[]};
test('assessment is non-executable even for approved matching evidence',async()=>{
 const gate=createProvisioningAuthorization({inspect:async()=>approved});
 assert.deepEqual(await gate.assess(input),{authorized:true,executable:false,blockers:[]});
});
test('assessment fails closed on mismatched, missing, expired and inconsistent evidence',async()=>{
 for(const evidence of [
  null,{...approved,status:'pending'},{...approved,operation:'deployment.rollback'},
  {...approved,target:'production'},{...approved,unexpired:false},
  {...approved,consistent:false},{...approved,blockers:['governance-evidence-mismatch']},
  {...approved,id:'00000000-0000-0000-0000-000000000009'}
 ]){
  const gate=createProvisioningAuthorization({inspect:async()=>evidence});
  const result=await gate.assess(input);
  assert.equal(result.authorized,false);
  assert.equal(result.executable,false);
 }
 const unavailable=createProvisioningAuthorization({inspect:async()=>{throw Error('offline');}});
 assert.deepEqual(await unavailable.assess(input),{authorized:false,executable:false,blockers:['governance-evidence-unavailable']});
});
test('invalid requests cannot be assessed',async()=>{
 const gate=createProvisioningAuthorization({inspect:async()=>approved});
 await assert.rejects(gate.assess({...input,tenantId:'invalid'}),/Invalid authorization request/);
 await assert.rejects(gate.assess({...input,target:''}),/Invalid authorization request/);
});
