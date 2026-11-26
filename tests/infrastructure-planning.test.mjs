import test from 'node:test';import assert from 'node:assert/strict';import {forecastCost,simulateCapacity,assessRecovery} from '../packages/infrastructure-planning/index.mjs';
test('cost projection uses integer cents',()=>{const r=forecastCost({monthlyCents:10000,additionalCents:2000,budgetCents:11000,months:12});assert.equal(r.total,144000);assert.equal(r.overBudget,true);});
test('capacity loss and demand reveal shortfall',()=>{const r=simulateCapacity({capacity:100,demand:70,additionalDemand:10,lostCapacity:30});assert.equal(r.headroom,-10);assert.equal(r.feasible,false);});
test('zero remaining capacity has no utilization ratio',()=>assert.equal(simulateCapacity({capacity:10,demand:1,additionalDemand:0,lostCapacity:10}).utilization,null));
test('recovery requires objectives and verification',()=>{const r=assessRecovery({rpoMinutes:60,rtoMinutes:120,backupAgeMinutes:61,restoreMinutes:121,restoreVerified:false});assert.deepEqual(r.blockers,['rpo','rto','restore-evidence']);assert.equal(r.executable,false);});
test('invalid values rejected',()=>assert.throws(()=>forecastCost({monthlyCents:-1,additionalCents:0,budgetCents:0,months:1})));
