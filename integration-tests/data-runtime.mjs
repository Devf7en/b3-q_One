import assert from 'node:assert/strict';
import pg from 'pg';
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
  assert.equal((await c.query("UPDATE one_runtime.memberships SET role='approver'")).rowCount,0);
 });
 await assert.rejects(transaction(context,c=>c.query('DELETE FROM one_runtime.projects')),/permission denied/);
 await assert.rejects(transaction({...context,tenantId:other},async()=>{}),/Unauthorized/);
 assert.equal((await pool.query('SELECT * FROM one_runtime.projects')).rowCount,0);
 console.log('Restricted PostgreSQL driver acceptance passed');
}finally{await pool.end();await admin.end();}
