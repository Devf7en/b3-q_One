import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../packages/contracts/environments.json',import.meta.url)));
test('canonical registry has 16 unique ordered environments',()=>{assert.equal(registry.environments.length,16);assert.equal(new Set(registry.environments.map(e=>e.id)).size,16);assert.deepEqual(registry.environments.map(e=>e.ordinal),Array.from({length:16},(_,i)=>i+1));});
