import assert from 'node:assert/strict';
import pg from 'pg';
import {createGovernanceService} from '../packages/transactional-governance/index.mjs';
import {verifyChain} from '../packages/audit-evidence/index.mjs';
import {createDataRuntime} from '../packages/data-runtime/index.mjs';
const admin=new pg.Pool();
const pool=new pg.Pool({user:'one_ci_login',password:'disposable-runtime-ci-only',max:1});
const t='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002',u='00000000-0000-0000-0000-000000000003',p='00000000-0000-0000-0000-000000000004';
try{
 await admin.query("CREATE ROLE one_ci_login LOGIN PASSWORD 'disposable-runtime-ci-only' IN ROLE one_service");
 await admin.query("INSERT INTO one_runtime.tenants VALUES ($1,'A'),($2,'B')",[t,other]);
 await admin.query("INSERT INTO one_runtime.identities VALUES ($1,'fixture','operator')",[u]);
 await admin.query("INSERT INTO one_runtime.memberships VALUES ($1,$2,'operator')",[t,u]);
 await admin.query("INSERT INTO one_runtime.projects VALUES ($1,$3,'A'),($2,$3,'B')",[t,other,p]);
 const transaction=createDataRuntime({pool,authenticate:async(token,tenantId)=>{if(token!=='fixture'||tenantId!==t)throw Error('Unauthorized');return {tenantId,userId:u,role:'operator'};}});
 const context={token:'fixture',tenantId:t};
 assert.equal((await pool.query('SELECT * FROM one_runtime.projects')).rowCount,0);
 await transaction(context,async c=>{
  assert.equal((await c.query('SELECT * FROM one_runtime.projects')).rowCount,1);

 });
 await assert.rejects(transaction(context,c=>c.query("UPDATE one_runtime.memberships SET role='approver'")),/permission denied/);
 await assert.rejects(transaction(context,c=>c.query('DELETE FROM one_runtime.projects')),/permission denied/);
 await assert.rejects(transaction({...context,tenantId:other},async()=>{}),/Unauthorized/);
 assert.equal((await pool.query('SELECT * FROM one_runtime.projects')).rowCount,0);
 const approver='00000000-0000-0000-0000-000000000005',id='00000000-0000-0000-0000-000000000006',failed='00000000-0000-0000-0000-000000000007';
 await admin.query("INSERT INTO one_runtime.identities VALUES ($1,'fixture','approver')",[approver]);
 await admin.query("INSERT INTO one_runtime.memberships VALUES ($1,$2,'approver')",[t,approver]);
 const governed=createDataRuntime({pool,authenticate:async(token,tenantId)=>{
  if(tenantId!==t||!['operator','approver'].includes(token))throw Error('Unauthorized');
  return {tenantId,userId:token==='operator'?u:approver,role:token};
 }});
 const service=createGovernanceService({transaction:governed});
 const operator={token:'operator',tenantId:t},reviewer={token:'approver',tenantId:t};
 const input={projectId:p,id,version:1,manifest:{kind:'simulation'},surface:'control'};
 const plan=await service.create(operator,input);
 await assert.rejects(service.approve(operator,{id,version:1,expectedDigest:plan.digest,surface:'control'}));
 await assert.rejects(service.approve(reviewer,{id,version:1,expectedDigest:'b'.repeat(64),surface:'control'}));
 await assert.rejects(service.create(operator,{...input,id:failed,surface:'observatory'}));
 const approval=await service.approve(reviewer,{id,version:1,expectedDigest:plan.digest,surface:'control'});
 assert.equal(approval.executable,false);
 await assert.rejects(service.approve(reviewer,{id,version:1,expectedDigest:plan.digest,surface:'control'}));
 const broken=createGovernanceService({transaction:governed,clock:()=> 'invalid timestamp'});
 await assert.rejects(broken.create(operator,{...input,id:failed}));
 assert.equal((await admin.query('SELECT * FROM one_runtime.plans WHERE id=$1',[failed])).rowCount,0);
 const events=(await admin.query("SELECT details FROM one_runtime.audit_events ORDER BY (details->>'sequence')::bigint")).rows.map(x=>x.details);
 assert.equal(events.length,2);
 assert.equal(verifyChain(events,t,events.at(-1).digest),true);
 assert.equal((await admin.query('SELECT * FROM one_runtime.approvals')).rowCount,1);
 console.log('Restricted PostgreSQL driver and transactional governance acceptance passed');
}finally{await pool.end();await admin.end();}
