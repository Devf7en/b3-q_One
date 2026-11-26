import test from 'node:test';
import assert from 'node:assert/strict';
import {createGovernanceRecords} from '../packages/governance-records/index.mjs';
import {createProvisioningAuthorization} from '../packages/provisioning-authorization/index.mjs';
const tenantId='00000000-0000-0000-0000-000000000001';
const requestId='00000000-0000-0000-0000-000000000003';
const requester='00000000-0000-0000-0000-000000000002';
const approver='00000000-0000-0000-0000-000000000004';
const input={token:'authenticated-test-token',tenantId,requestId,operation:'service.restart',target:'staging'};
function setup({status='approved',unexpired=true,events,role='viewer',membership=true}={}){
 const seen=[];
 const request={id:requestId,status,operation:input.operation,target:input.target,
  requested_by:requester,decided_by:status==='approved'?approver:null,
  decided_at:status==='pending'?null:new Date('2026-11-26T00:00:00Z'),
  expires_at:new Date('2026-11-27T00:00:00Z'),unexpired};
 const history=events??[
  {actor_id:requester,event:'registered',occurred_at:new Date('2026-11-25T00:00:00Z')},
  {actor_id:approver,event:'approved',occurred_at:new Date('2026-11-26T00:00:00Z')}];
 const transaction=async({token,tenantId:t},work)=>{
  assert.equal(token,input.token);assert.equal(t,tenantId);
  if(!membership)throw Error('Membership changed');
  const principal={tenantId:t,userId:requester,role};
  return work({query:async(sql,args)=>{
   seen.push({sql,args});
   return {rows:sql.includes('governance_requests')?[request]:history};
  }},principal);
 };
 const records=createGovernanceRecords({transaction});
 return {gate:createProvisioningAuthorization({inspect:args=>records.inspect(args)}),seen};
}
test('authenticated tenant-scoped reconciliation permits assessment only, never execution',async()=>{
 const {gate,seen}=setup();
 const result=await gate.assess(input);
 assert.deepEqual(result,{authorized:true,executable:false,blockers:[]});
 assert.equal(seen.length,2);
 assert.ok(seen.every(({args})=>args[0]===tenantId&&args[1]===requestId));
});
test('governance boundary fails closed on expired evidence, membership failure, or missing audit',async()=>{
 for(const config of [
  {unexpired:false},{membership:false},{role:'unknown'},
  {events:[{actor_id:requester,event:'registered',occurred_at:new Date('2026-11-25T00:00:00Z')}]},
  {events:[{actor_id:requester,event:'registered',occurred_at:new Date('2026-11-25T00:00:00Z')},
   {actor_id:requester,event:'approved',occurred_at:new Date('2026-11-26T00:00:00Z')}]}
 ]){
  const result=await setup(config).gate.assess(input);
  assert.equal(result.authorized,false);
  assert.equal(result.executable,false);
 }
});
