import test from 'node:test';import assert from 'node:assert/strict';import {createApiServer} from '../packages/api-http/index.mjs';
test('HTTP transport validates and forwards bounded requests',async()=>{
 const calls=[];const server=createApiServer({maxBodyBytes:64,gateway:async r=>{calls.push(r);return {status:200,body:{ok:true}};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/v1/control/plans',headers={authorization:'Bearer fixture','x-tenant-id':'fixture','content-type':'application/json'};
 try{
 assert.equal((await fetch(url)).status,401);
 assert.equal((await fetch(url,{method:'POST',headers,body:'{'})).status,400);
 assert.equal((await fetch(url,{method:'POST',headers,body:'x'.repeat(65)})).status,413);
 assert.equal((await fetch(url,{method:'POST',headers:{...headers,'content-type':'text/plain'},body:'{}'})).status,415);
 assert.equal(calls.length,0);
 const response=await fetch(url,{method:'POST',headers,body:'{"manifest":{}}'});
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(calls[0].token,'fixture');assert.deepEqual(calls[0].body,{manifest:{}});
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
