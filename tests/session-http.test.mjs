import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionHttp} from '../packages/session-http/index.mjs';
import {createSessionGateway} from '../packages/session-gateway/index.mjs';
import {createBrowserSessions} from '../packages/browser-session/index.mjs';
test('HTTP evidence and logout through server-held session',async()=>{
 const tenantId='00000000-0000-0000-0000-000000000001',origin='https://one.example';
 const sessions=createBrowserSessions({authenticate:async()=>({tenantId,userId:'fixture'})});
 const cookie=(await sessions.issue({token:'fixture',tenantId})).setCookie.split(';')[0];
 const server=createSessionHttp({dispatch:createSessionGateway({sessions,origin,gateway:async input=>{assert.equal(input.token,'fixture');return {status:200,body:{records:[]}};}})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 try{
 assert.equal((await fetch(base+'/v1/observatory/evidence')).status,401);
 assert.equal((await fetch(base+'/v1/observatory/evidence',{headers:{cookie}})).status,200);
 assert.equal((await fetch(base+'/session/logout',{method:'POST',headers:{cookie,origin:'https://other.example'}})).status,403);
 const logout=await fetch(base+'/session/logout',{method:'POST',headers:{cookie,origin}});assert.equal(logout.status,200);assert.match(logout.headers.get('set-cookie'),/Max-Age=0$/);
 assert.equal((await fetch(base+'/v1/observatory/evidence',{headers:{cookie}})).status,401);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
