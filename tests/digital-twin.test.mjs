import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateResourceChange} from '../apps/control-command-center/public/inspector.mjs';
const before=Object.freeze({id:'infra-001',kind:'Compute',name:'Demo compute node',cpu:4,ram:8,port:443,backup:true});
test('simulation preserves original and reports typed changes',()=>{const r=simulateResourceChange('infrastructure',before,{...before,cpu:8});assert.deepEqual(r.changes,[{property:'cpu',before:4,after:8}]);assert.equal(before.cpu,4);assert.equal(r.potentialOutageImpact.length,4);assert.equal(r.executable,false);assert.equal(r.requiresReview,true);});
test('unchanged configuration has no modeled impact',()=>{const r=simulateResourceChange('infrastructure',before,{...before});assert.deepEqual(r.changes,[]);assert.deepEqual(r.potentialOutageImpact,[]);});
test('invalid identity and property values rejected',()=>{for(const patch of [{id:'other'},{kind:'Database'},{cpu:0},{ram:NaN},{backup:'true'},{name:''}])assert.throws(()=>simulateResourceChange('infrastructure',before,{...before,...patch}));});
