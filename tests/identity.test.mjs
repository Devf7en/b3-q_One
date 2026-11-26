import test from 'node:test';import assert from 'node:assert/strict';import {createIdentityBoundary} from '../packages/identity/index.mjs';
const claims={iss:'https://issuer.example',aud:'one-api',sub:'subject',exp:200,role:'approver'};
const membership={tenantId:'t1',userId:'u1',role:'viewer'};
const build=(c=claims,m=membership)=>createIdentityBoundary({issuer:claims.iss,audience:claims.aud,clock:()=>100000,verifyToken:async()=>c,findMembership:async()=>m});
test('role comes from membership not token',async()=>assert.deepEqual(await build()('fixture','t1'),membership));
test('rejects expired wrong issuer and audience',async()=>{for(const c of [{...claims,exp:100},{...claims,iss:'other'},{...claims,aud:'other'}])await assert.rejects(build(c)('fixture','t1'));});
test('rejects missing or cross tenant membership',async()=>{await assert.rejects(build(claims,null)('fixture','t1'));await assert.rejects(build()('fixture','t2'));});
test('requires verification dependencies',()=>assert.throws(()=>createIdentityBoundary({})));
