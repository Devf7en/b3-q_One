import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {planProviderOperation} from '../packages/provider-boundary/index.mjs';
const registry=JSON.parse(readFileSync(new URL('../packages/contracts/providers.json',import.meta.url)));
const input={providerId:'local-docker',tenantId:'t',projectId:'p',capability:'containers',operation:'propose-change',resourceRef:'demo'};
test('candidate registry remains disconnected',()=>{assert.equal(registry.providers.length,10);assert.equal(new Set(registry.providers.map(p=>p.id)).size,10);assert.ok(registry.providers.every(p=>!p.connected));});
test('change planning requires approval and never executes',()=>{const p=planProviderOperation(registry,input);assert.equal(p.executable,false);assert.equal(p.approvalRequired,true);});
test('unknown capability, missing tenant and execution rejected',()=>{for(const patch of [{capability:'dns'},{tenantId:''},{operation:'execute'},{providerId:'unknown'}])assert.throws(()=>planProviderOperation(registry,{...input,...patch}));});
