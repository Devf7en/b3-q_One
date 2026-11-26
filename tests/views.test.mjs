import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const c=JSON.parse(readFileSync(new URL('../packages/contracts/views.json',import.meta.url)));
test('seven unique views with independent themes',()=>{assert.equal(c.views.length,7);assert.equal(new Set(c.views.map(v=>v.id)).size,7);assert.ok(c.views.some(v=>v.id===c.defaultView));assert.deepEqual(c.themes,['light','dark','system']);assert.equal(c.permissionModel,'server-authoritative');});
