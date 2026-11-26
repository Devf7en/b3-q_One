import test from 'node:test';
import assert from 'node:assert/strict';
import {createGovernanceRecords} from '../packages/governance-records/index.mjs';
const tenantId='00000000-0000-0000-0000-000000000001';
const requestId='00000000-0000-0000-0000-000000000003';
const operator='00000000-0000-0000-0000-000000000002';
const approver='00000000-0000-0000-0000-000000000004';
function fixture(role='operator',rows=[{id:requestId,status:'pending'}]){
 const calls=[];
 const client={query:async(sql,args)=>{calls.push({sql,args});return {rows:sql.includes('RETURNING')?rows:[]};}};
 const records=createGovernanceRecords({transaction:async({tenantId:t},work)=>{assert.equal(t,tenantId);return work(client,{tenantId:t,userId:role==='operator'?operator:approver,role});}});
 return {records,calls};
}
test('register writes request and audit inside tenant-scoped transaction',async()=>{
 const {records,calls}=fixture();
 const result=await records.register({token:'fixture',tenantId,requestId,operation:'service.restart',target:'staging',reason:'incident'});
 assert.deepEqual(result,{id:requestId,status:'pending',executable:false});
 assert.equal(calls.length,2);
 assert.deepEqual(calls[0].args.slice(0,2),[tenantId,requestId]);
 assert.equal(calls[1].args[3],'registered');
});
test('only approver can decide and decisions remain non-executable',async()=>{
 const {records,calls}=fixture('approver',[{id:requestId,status:'approved'}]);
 const result=await records.decide({token:'fixture',tenantId,requestId,decision:'approved'});
 assert.equal(result.executable,false);
 assert.equal(result.status,'approved');
 assert.match(calls[0].sql,/requested_by<>\$2/);
 assert.equal(calls[1].args[3],'approved');
 await assert.rejects(fixture('operator').records.decide({token:'fixture',tenantId,requestId,decision:'approved'}),/Forbidden/);
});
test('rejects invalid inputs, duplicate registrations and missing decisions',async()=>{
 const args={token:'fixture',tenantId,requestId,operation:'service.restart',target:'staging',reason:'incident'};
 await assert.rejects(fixture().records.register({...args,requestId:'bad'}),/Invalid request/);
 await assert.rejects(fixture('approver').records.register(args),/Forbidden/);
 await assert.rejects(fixture('operator',[]).records.register(args),/Duplicate request/);
 await assert.rejects(fixture('approver',[]).records.decide({token:'fixture',tenantId,requestId,decision:'approved'}),/Not pending/);
 await assert.rejects(fixture('approver').records.decide({token:'fixture',tenantId,requestId,decision:'executed'}),/Invalid decision/);
});

test('approval is gated by database expiry and expiry is audited',async()=>{
 const approval=fixture('approver',[{id:requestId,status:'approved'}]);
 await approval.records.decide({token:'fixture',tenantId,requestId,decision:'approved'});
 assert.match(approval.calls[0].sql,/expires_at>NOW\(\)/);
 const expiry=fixture('operator',[{id:requestId,status:'expired'}]);
 const result=await expiry.records.expire({token:'fixture',tenantId,requestId});
 assert.deepEqual(result,{id:requestId,status:'expired',executable:false});
 assert.match(expiry.calls[0].sql,/expires_at<=NOW\(\)/);
 assert.equal(expiry.calls[1].args[3],'expired');
 await assert.rejects(fixture('operator',[]).records.expire({token:'fixture',tenantId,requestId}),/Not expired/);
 await assert.rejects(fixture('viewer').records.expire({token:'fixture',tenantId,requestId}),/Forbidden/);
});

test('read-only reconciliation verifies request and audit lifecycle evidence',async()=>{
 const calls=[];
 const principal={tenantId,userId:operator,role:'viewer'};
 const request={id:requestId,status:'approved',requested_by:operator,decided_by:approver,decided_at:'2026-11-26T00:00:00Z',expires_at:'2026-11-27T00:00:00Z'};
 let events=[{actor_id:operator,event:'registered',occurred_at:'2026-11-25T00:00:00Z'},{actor_id:approver,event:'approved',occurred_at:'2026-11-26T00:00:00Z'}];
 const records=createGovernanceRecords({transaction:async(_context,work)=>work({query:async(sql,args)=>{
  calls.push({sql,args});return {rows:sql.includes('governance_requests')?[request]:events};
 }},principal)});
 const good=await records.inspect({token:'fixture',tenantId,requestId});
 assert.equal(good.consistent,true);
 assert.equal(good.executable,false);
 assert.equal(good.evidenceCount,2);
 assert.equal(calls.length,2);
 assert.ok(calls.every(x=>x.args[0]===tenantId&&x.args[1]===requestId));
 events=[events[0],{...events[1],actor_id:operator}];
 const bad=await records.inspect({token:'fixture',tenantId,requestId});
 assert.equal(bad.consistent,false);
 assert.deepEqual(bad.blockers,['governance-evidence-mismatch']);
});
