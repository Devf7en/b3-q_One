import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendResourceChange} from '../apps/control-command-center/public/inspector.mjs';
const before=Object.freeze({id:'infra-001',kind:'Compute',name:'Demo compute node',cpu:4,ram:8,port:443,backup:true});
test('reduction, disabled setting and connectivity changes require review',()=>{const r=recommendResourceChange('infrastructure',before,{...before,cpu:2,backup:false,port:8443});assert.deepEqual(r.findings.map(f=>f.code).sort(),['BOOLEAN_DISABLED','CONNECTIVITY_CHANGE','DEPENDENCY_REVIEW','NUMERIC_REDUCTION']);assert.equal(r.recommendation,'review-required');assert.equal(r.authorized,false);assert.equal(r.executable,false);});
test('no changes produce no findings',()=>{const r=recommendResourceChange('infrastructure',before,{...before});assert.equal(r.recommendation,'no-change');assert.deepEqual(r.findings,[]);});
test('invalid proposals cannot receive recommendations',()=>assert.throws(()=>recommendResourceChange('infrastructure',before,{...before,cpu:-1})));
