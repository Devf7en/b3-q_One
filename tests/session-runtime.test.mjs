import test from 'node:test';
import assert from 'node:assert/strict';
import {createLoginFlow} from '../packages/oidc-login/index.mjs';
import {createBrowserSessions} from '../packages/browser-session/index.mjs';
import {createSessionRuntime} from '../packages/session-http/runtime.mjs';
const origin='https://one.example',tenantId='11111111-1111-4111-8111-111111111111',userId='22222222-2222-4222-8222-222222222222';
function fixture(){
 const sessions=createBrowserSessions({authenticate:async(token,tenant,subject)=>token==='fixture-access'&&tenant===tenantId&&(!subject||subject==='fixture-sub')?{tenantId,userId,role:'operator'}:null});
 const flow=createLoginFlow({authorizationEndpoint:'https://identity.example/authorize',clientId:'one',redirectUri:origin+'/session/callback',exchange:async()=>({accessToken:'fixture-access'}),verifyIdentity:async(_,expected)=>({sub:'fixture-sub',nonce:expected.nonce}),sessions});
 return createSessionRuntime({flow,sessions,origin,tenantId,gateway:async()=>({status:200,body:{records:[]}})}).dispatch;
}
const request=(dispatch,method,path,headers={})=>dispatch({method,path,headers:{host:'one.example',...headers}});
test('login callback profile logout and replay rejection',async()=>{
 const d=fixture(),start=await request(d,'POST','/session/login',{origin});
 assert.equal(start.status,303);
 const state=new URL(start.headers.Location).searchParams.get('state'),binding=start.headers['Set-Cookie'].split(';')[0];
 const path='/session/callback?state='+state+'&code=fixture';
 const callback=await request(d,'GET',path,{cookie:binding});
 assert.equal(callback.status,303);assert.equal(callback.headers.Location,origin+'/');
 const cookie=callback.headers['Set-Cookie'][0].split(';')[0];
 const profile=await request(d,'GET','/session/profile',{cookie});
 assert.equal(profile.status,200);assert.equal(profile.body.userId,userId);assert.equal(profile.body.role,'operator');assert.equal(profile.body.tenantId,tenantId);assert.equal(Object.hasOwn(profile.body,'token'),false);assert.equal(JSON.stringify(profile.body).includes('fixture-access'),false);
 assert.equal((await request(d,'GET',path,{cookie:binding})).status,400);
 assert.equal((await request(d,'POST','/session/logout',{origin,cookie})).status,200);
 assert.equal((await request(d,'GET','/session/profile',{cookie})).status,401);
});
test('host origin methods and unlisted operations fail closed',async()=>{
 const d=fixture();
 assert.equal((await request(d,'POST','/session/login',{origin:'https://other.example'})).status,403);
 assert.equal((await request(d,'GET','/session/login')).status,405);
 assert.equal((await request(d,'GET','/session/profile',{host:'other.example'})).status,403);
 assert.equal((await request(d,'POST','/v1/control/plans',{origin})).status,404);
 assert.equal((await request(d,'GET','/v1/observatory/evidence')).status,401);
 assert.equal((await request(d,'GET','/session/callback?state=a&state=b&code=c')).status,400);
});
