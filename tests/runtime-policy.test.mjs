import test from 'node:test';import assert from 'node:assert/strict';import {authorize} from '../packages/runtime-policy/index.mjs';
const principal={userId:'u1',tenantId:'t1',role:'operator'},resource={tenantId:'t1',createdBy:'u1'};
test('tenant isolation and default denial',()=>{assert.equal(authorize({principal,resource,action:'plan.create',surface:'control'}),true);assert.equal(authorize({principal,resource:{tenantId:'t2'},action:'plan.read',surface:'control'}),false);assert.equal(authorize({principal,resource,action:'execute',surface:'control'}),false);});
test('observatory denies writes',()=>assert.equal(authorize({principal,resource,action:'plan.create',surface:'observatory'}),false));
test('approval separation',()=>{const p={...principal,role:'approver'};assert.equal(authorize({principal:p,resource,action:'plan.approve',surface:'control'}),false);assert.equal(authorize({principal:p,resource:{...resource,createdBy:'u2'},action:'plan.approve',surface:'control'}),true);});
