import test from 'node:test';
import assert from 'node:assert/strict';
import {planCommand} from '../packages/command-governance/index.mjs';
import {planWorkflow,planDelegation} from '../packages/orchestration/index.mjs';
import {simulateCapacity,forecastCost,assessRecovery} from '../packages/infrastructure-planning/index.mjs';
import {evaluateRelease} from '../packages/security-governance/index.mjs';

test('infrastructure change produces reviewable plan without execution authority',()=>{
 const capacity=simulateCapacity({capacity:20,demand:10,additionalDemand:4,lostCapacity:2});
 assert.equal(capacity.feasible,true);
 const cost=forecastCost({monthlyCents:2000,additionalCents:400,budgetCents:3000,months:3});
 assert.equal(cost.overBudget,false);
 const command=planCommand({workspaceId:'W09',operation:'service.restart',target:'staging',parameters:{resource:'staging-api'}});
 assert.equal(command.approvalRequired,true);
 assert.equal(command.authorizationRequired,true);
 assert.equal(command.executable,false);
 const workflow=planWorkflow([{id:'inspect',kind:'read',dependsOn:[]},{id:'change',kind:'change',dependsOn:['inspect']},{id:'verify',kind:'read',dependsOn:['change']}]);
 assert.deepEqual(workflow.steps.map(s=>s.id),['inspect','change','verify']);
 assert.equal(workflow.steps[1].approvalRequired,true);
 assert.equal(workflow.executable,false);
 const release=evaluateRelease([],[]);
 assert.equal(release.decision,'blocked');
 assert.equal(release.executable,false);
 assert.ok(release.blockers.includes('build'));
});

test('unsafe capacity, recovery and delegation remain blocked',()=>{
 const capacity=simulateCapacity({capacity:8,demand:7,additionalDemand:3,lostCapacity:2});
 assert.equal(capacity.feasible,false);
 const recovery=assessRecovery({rpoMinutes:15,rtoMinutes:30,backupAgeMinutes:40,restoreMinutes:45,restoreVerified:false});
 assert.equal(recovery.decision,'blocked');
 assert.deepEqual(recovery.blockers,['rpo','rto','restore-evidence']);
 const agent=planDelegation({agent:'planner',task:'review staging',model:'unapproved',allowedModels:['approved'],budget:100,estimatedCost:120,permissions:[],requiredPermissions:['plan:review']});
 assert.equal(agent.decision,'blocked');
 assert.deepEqual(agent.blockers,['model','budget','permissions']);
 assert.equal(agent.executable,false);
});

test('read-only command is non-executable without an adapter',()=>{
 const read=planCommand({workspaceId:'W11',operation:'container.inspect',target:'staging',parameters:{resource:'api'}});
 assert.equal(read.approvalRequired,false);
 assert.equal(read.authorizationRequired,true);
 assert.equal(read.executable,false);
 assert.throws(()=>planCommand({workspaceId:'W09',operation:'shell.exec',target:'staging'}),/Unsupported operation/);
});
