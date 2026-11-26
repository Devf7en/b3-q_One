import assert from 'node:assert/strict';
import {createDockerInventory} from '../packages/docker-inventory/index.mjs';
const collect=createDockerInventory();
for(const kind of ['containers','images','networks','volumes']){const result=await collect(kind);assert.equal(result.state,'live',kind);assert.equal(result.executable,false);assert.ok(Array.isArray(result.records));assert.ok(result.observed_at);console.log(kind,result.records.length);}
