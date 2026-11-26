import test from 'node:test';import assert from 'node:assert/strict';import {planWorkflow,planDelegation} from '../packages/orchestration/index.mjs';
test('workflow orders dependencies and marks changes',()=>{const p=planWorkflow([{id:'b',dependsOn:['a'],kind:'change'},{id:'a',dependsOn:[],kind:'read'}]);assert.deepEqual(p.steps,[{id:'a',approvalRequired:false},{id:'b',approvalRequired:true}]);assert.equal(p.executable,false);});
test('invalid dependencies and cycles rejected',()=>{for(const steps of [[{id:'a',dependsOn:['a'],kind:'read'}],[{id:'a',dependsOn:['missing'],kind:'read'}]])assert.throws(()=>planWorkflow(steps));});
const base={agent:'demo',task:'inspect',model:'demo-model',allowedModels:['demo-model'],budget:100,estimatedCost:50,permissions:['read'],requiredPermissions:['read']};
test('delegation remains non executable',()=>{assert.equal(planDelegation(base).decision,'eligible-for-review');assert.equal(planDelegation(base).executable,false);});
test('budget model and permission blockers',()=>assert.deepEqual(planDelegation({...base,model:'other',estimatedCost:101,requiredPermissions:['write']}).blockers,['model','budget','permissions']));
