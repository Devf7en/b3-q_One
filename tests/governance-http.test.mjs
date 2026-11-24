import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {createSessionRuntime} from '../packages/session-http/runtime.mjs';
const origin='https://one.example',tenantId='11111111-1111-4111-8111-111111111111';
const projectId='22222222-2222-4222-8222-222222222222';
const planId='33333333-3333-4333-8333-333333333333';
function runtime(enableGovernance=false){
 const calls=[];
 const sessions={resolve:async cookie=>cookie==='__Host-one_session=valid'?{token:'opaque-access',tenantId}:null,revoke:()=>({setCookie:'__Host-one_session=; Path=/; Max-Age=0'})};
 const flow={begin:()=>({location:'https://identity.example/authorize',setCookie:'__Host-one_login=state; Path=/; Secure'}),complete:async()=>{throw Error('not used');}};
 const gateway=async req=>{calls.push(req);return {status:201,body:{record:{id:planId},executable:false}};};
 const server=createSessionRuntime({flow,sessions,gateway,origin,tenantId,enableGovernance}).server;
 return {server,calls};
}
async function start(t,enabled){
 const instance=runtime(enabled);await new Promise((resolve,reject)=>{instance.server.once('error',reject);instance.server.listen(0,'127.0.0.1',resolve);});
 t.after(()=>new Promise(resolve=>instance.server.close(resolve)));
 const send=(method,path,headers={},body)=>new Promise((resolve,reject)=>{
 const req=httpRequest({hostname:'127.0.0.1',port:instance.server.address().port,method,path,headers:{host:'one.example',...headers}},res=>{
 const chunks=[];res.on('data',v=>chunks.push(v));res.on('end',()=>{const raw=Buffer.concat(chunks).toString();resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(raw)});});res.on('error',reject);
 });req.on('error',reject);req.end(body);
 });
 return {...instance,send};
}
const cookie='__Host-one_session=valid',manifest={format:'one-resource-review-v1',executable:false};
test('governance remains disabled by default',async t=>{
 const {send,calls}=await start(t,false);
 assert.equal((await send('POST','/v1/control/plans',{origin,cookie,'content-type':'application/json'},JSON.stringify({projectId,manifest}))).status,400);
 assert.equal((await send('GET','/v1/control/projects',{cookie})).status,404);
 assert.equal(calls.length,0);
});
test('opt-in governance requires session and exact origin; forwards bounded JSON',async t=>{
 const {send,calls}=await start(t,true);
 const path='/v1/control/plans',body=JSON.stringify({projectId,manifest});
 assert.equal((await send('POST',path,{origin,cookie,'content-type':'application/json'},body)).status,201);
 assert.equal(calls.length,1);assert.equal(calls[0].tenantId,tenantId);assert.equal(calls[0].token,'opaque-access');
 assert.deepEqual(calls[0].body,{projectId,manifest});assert.equal(calls[0].body.executable,undefined);
 assert.equal((await send('POST',path,{origin,'content-type':'application/json'},body)).status,401);
 assert.equal((await send('POST',path,{origin:'https://evil.example',cookie,'content-type':'application/json'},body)).status,403);
 assert.equal((await send('POST',path,{cookie,'content-type':'application/json'},body)).status,403);
 assert.equal((await send('POST',path,{origin,cookie,'content-type':'text/plain'},body)).status,415);
 assert.equal((await send('POST',path,{origin,cookie,'content-type':'application/json'},'{')).status,400);
 assert.equal((await send('POST',path,{origin,cookie,'content-type':'application/json'},'[]')).status,400);
 assert.equal((await send('POST',path,{origin,cookie,'content-type':'application/json'},' '.repeat(65537))).status,400);
 assert.equal(calls.length,1);
});
test('opt-in approval and reads are session-bound; Observatory remains read-only',async t=>{
 const {send,calls}=await start(t,true);
 const approval='/v1/control/plans/'+planId+'/approve';
 const result=await send('POST',approval,{origin,cookie,'content-type':'application/json'},JSON.stringify({version:1,expectedDigest:'a'.repeat(64)}));
 assert.equal(result.status,201);assert.equal(calls.at(-1).path,approval);
 assert.equal((await send('GET','/v1/control/projects',{cookie})).status,201);
 assert.equal((await send('POST','/v1/observatory/evidence',{origin,cookie,'content-type':'application/json'},'{}')).status,400);
 assert.equal((await send('POST','/v1/control/projects',{origin,cookie,'content-type':'application/json'},'{}')).status,400);
 assert.equal((await send('POST','/v1/control/plans/'+planId+'/approve',{origin,cookie,'content-type':'application/json'},'{}')).status,201);
});
