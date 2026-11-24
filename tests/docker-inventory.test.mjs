import test from 'node:test';import assert from 'node:assert/strict';import {createDockerInventory} from '../packages/docker-inventory/index.mjs';
test('allowlisted inventory strips sensitive fields and never executes mutations',async()=>{
 const calls=[];const collect=createDockerInventory({execute:async args=>{calls.push(args);return JSON.stringify({ID:'abc',Names:'demo',State:'running',Command:'secret',Labels:'secret',Mounts:'secret'});},clock:()=> '2026-01-01T00:00:00Z'});
 const result=await collect('containers');assert.equal(result.state,'live');assert.equal(result.executable,false);assert.deepEqual(result.records,[{ID:'abc',Names:'demo',State:'running'}]);
 await assert.rejects(collect('rm'));assert.equal(calls.length,1);assert.deepEqual(calls[0],['container','ls','--all','--no-trunc','--format','{{json .}}']);
 for(const kind of ['images','networks','volumes'])assert.equal((await collect(kind)).state,'live');
});
test('collector fails closed without exposing diagnostic secrets',async()=>{for(const execute of [async()=>{throw Error('secret');},async()=>'{',async()=> 'x'.repeat(2097153)]){const result=await createDockerInventory({execute})('containers');assert.equal(result.state,'unavailable');assert.equal(result.observed_at,null);assert.deepEqual(result.records,[]);assert.equal(JSON.stringify(result).includes('secret'),false);}});
