import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReviewManifest} from '../apps/control-command-center/public/inspector.mjs';
import {canonical} from '../packages/governance-ledger/index.mjs';
const before={id:'infra-001',kind:'Compute',name:'Demo compute node',cpu:4,ram:8,port:443,backup:true};
test('local review manifest is JSON compatible and never grants authorization',()=>{const m=buildReviewManifest('infrastructure',before,{...before,cpu:8});assert.equal(m.reviewState,'local-draft');assert.equal(m.authorized,false);assert.equal(m.executable,false);assert.equal(m.requiresIndependentApproval,true);assert.equal(JSON.parse(canonical(m)).resourceId,before.id);});
test('unchanged and invalid proposals rejected',()=>{assert.throws(()=>buildReviewManifest('infrastructure',before,before));assert.throws(()=>buildReviewManifest('infrastructure',before,{...before,cpu:0}));});
