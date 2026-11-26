import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {integrationStatus,surfaceAllows} from '../packages/integration-boundary/index.mjs';
const registry=JSON.parse(readFileSync(new URL('../packages/contracts/integrations.json',import.meta.url)));
test('eight distinct integration boundaries remain disconnected',()=>{assert.equal(registry.integrations.length,8);assert.equal(new Set(registry.integrations.map(x=>x.id)).size,8);for(const x of registry.integrations)assert.equal(integrationStatus(registry,x.id).executable,false);});
test('unknown integration rejected',()=>assert.throws(()=>integrationStatus(registry,'unknown')));
test('both demonstration surfaces deny mutation',()=>{for(const s of ['control','observatory']){assert.equal(surfaceAllows(s,'read'),true);assert.equal(surfaceAllows(s,'mutate'),false);}assert.equal(surfaceAllows('unknown','read'),false);});
