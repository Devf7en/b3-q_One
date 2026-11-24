import {createServer} from 'node:http';
export function createApiServer({gateway,maxBodyBytes=65536}={}){
 if(typeof gateway!=='function'||!Number.isSafeInteger(maxBodyBytes)||maxBodyBytes<1||maxBodyBytes>1048576)throw Error('Invalid transport configuration');
 const server=createServer({requestTimeout:15000,headersTimeout:10000,maxHeaderSize:16384},async(req,res)=>{
 const send=(status,body)=>{if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"});res.end(JSON.stringify(body));};
 const reject=(status,error)=>{res.setHeader('Connection','close');send(status,{error});req.resume();};
 try{
 if(!['GET','POST'].includes(req.method))return reject(405,'Method not allowed');
 if(!/^\/v1\/[a-z0-9/-]+(?:\?[a-z0-9=&-]{1,100})?$/.test(req.url??''))return reject(404,'Not found');
 const auth=/^Bearer ([^\s,]+)$/.exec(req.headers.authorization??'');
 if(!auth)return reject(401,'Authentication required');
 const tenantId=req.headers['x-tenant-id'];
 let body;
 if(req.method==='POST'){
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']??''))return reject(415,'JSON required');
 if(Number(req.headers['content-length']??0)>maxBodyBytes)return reject(413,'Body too large');
 const chunks=[];let size=0;
 for await(const chunk of req.iterator({destroyOnReturn:false})){
 size+=chunk.length;if(size>maxBodyBytes)return reject(413,'Body too large');chunks.push(chunk);
 }
 try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{return reject(400,'Invalid JSON');}
 }else if(req.headers['transfer-encoding']||Number(req.headers['content-length']??0)>0)return reject(400,'Unexpected body');
 const result=await gateway({method:req.method,path:req.url,token:auth[1],tenantId,body});
 send(result.status,result.body);
 }catch{send(500,{error:'Request unavailable'});}
 });
 server.setTimeout(20000,socket=>socket.destroy());
 return server;
}
