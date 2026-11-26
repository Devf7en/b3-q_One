import test from 'node:test';import assert from 'node:assert/strict';import {createPlan,verifyPlan,approvePlan} from '../packages/governance-ledger/index.mjs';
const operator={tenantId:'t1',userId:'u1',role:'operator'},reviewer={tenantId:'t1',userId:'u2',role:'approver'};
const make=(manifest={a:1,b:2},version=1)=>createPlan({principal:operator,project:{tenantId:'t1',id:'p1'},id:'plan1',version,manifest,surface:'control'});
const approve=(plan,principal=reviewer,surface='control',expectedDigest=plan.digest)=>approvePlan({principal,plan,surface,expectedDigest});
test('canonical ordering and version binding',()=>{assert.equal(make().digest,make({b:2,a:1}).digest);assert.notEqual(make().digest,make(undefined,2).digest);});
test('tampering and stale digest denied',()=>{const p=make();p.manifest.a=3;assert.equal(verifyPlan(p),false);assert.throws(()=>approve(p));assert.throws(()=>approve(make(undefined,2),reviewer,'control',make().digest));});
test('independent tenant scoped approval only',()=>{const p=make();assert.equal(approve(p).executable,false);assert.throws(()=>approve(p,{...reviewer,userId:'u1'}));assert.throws(()=>approve(p,{...reviewer,tenantId:'t2'}));assert.throws(()=>approve(p,reviewer,'observatory'));});
test('manifest snapshot and invalid input',()=>{const m={a:1};const p=make(m);m.a=2;assert.equal(verifyPlan(p),true);assert.throws(()=>make({a:undefined}));});
