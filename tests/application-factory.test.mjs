import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {composeFactory} from '../packages/application-factory/index.mjs';
const {factories}=JSON.parse(readFileSync(new URL('../packages/contracts/factories.json',import.meta.url)));
test('eight distinct factory families',()=>{assert.equal(factories.length,8);assert.equal(new Set(factories.map(f=>f.id)).size,8);});
test('academia preserves SIS LMS HRIS',()=>{const p=composeFactory(factories,{factoryId:'academia',projectId:'demo'});assert.deepEqual(p.components.map(c=>c.id),['sis','lms','hris']);assert.equal(p.executable,false);});
test('custom composition deduplicates and validates',()=>{assert.equal(composeFactory(factories,{factoryId:'custom',projectId:'demo',components:['api','api']}).components.length,1);assert.throws(()=>composeFactory(factories,{factoryId:'custom',projectId:'demo',components:['../bad']}));});
test('unknown and empty factories rejected',()=>{for(const factoryId of ['unknown','custom'])assert.throws(()=>composeFactory(factories,{factoryId,projectId:'demo'}));});
