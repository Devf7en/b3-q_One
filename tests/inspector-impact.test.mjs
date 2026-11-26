import test from 'node:test';
import assert from 'node:assert/strict';
import {modeledImpact} from '../apps/control-command-center/public/inspector.mjs';
test('operational impact follows reverse dependencies only',()=>{const r=modeledImpact('infrastructure');assert.deepEqual(r.affected.map(x=>x.environment).sort(),['containers','data','domains','hosting']);assert.equal(r.executable,false);assert.equal(r.state,'demonstration');});
test('cycles terminate and unrelated edges do not propagate',()=>{const r=modeledImpact('hosting',[['domains','hosting','routes-to'],['hosting','domains','depends-on'],['security','hosting','monitored-by']]);assert.deepEqual(r.affected.map(x=>x.environment),['domains']);});
test('unknown roots rejected',()=>assert.throws(()=>modeledImpact('unknown')));
