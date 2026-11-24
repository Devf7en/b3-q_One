import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createLoginFlow} from '../packages/oidc-login/index.mjs';
test('PKCE, browser binding, nonce, replay and expiry',async()=>{
 let now=1000,challenge,nonce;
 const tenantId='00000000-0000-0000-0000-000000000001';
 const flow=createLoginFlow({authorizationEndpoint:'https://id.example/authorize',redirectUri:'https://one.example/callback',clientId:'one',clock:()=>now,exchange:async({codeVerifier})=>{assert.equal(createHash('sha256').update(codeVerifier).digest('base64url'),challenge);return {accessToken:'fixture'};},verifyIdentity:async(_,expected)=>{assert.equal(expected.nonce,nonce);return {sub:'subject',nonce};},sessions:{issue:async input=>{assert.deepEqual(input,{token:'fixture',tenantId,expectedSubject:'subject'});return {setCookie:'fixture-cookie'};}}});
 function begin(){const start=flow.begin(tenantId),p=new URL(start.location).searchParams;challenge=p.get('code_challenge');nonce=p.get('nonce');assert.equal(p.get('code_challenge_method'),'S256');return {state:p.get('state'),code:'fixture',binding:start.setCookie.split(';')[0].split('=')[1]};}
 const callback=begin();await assert.rejects(flow.complete({...callback,binding:'a'.repeat(43)}));assert.equal((await flow.complete(callback)).setCookie,'fixture-cookie');await assert.rejects(flow.complete(callback));
 const expired=begin();now+=300001;await assert.rejects(flow.complete(expired));
});
