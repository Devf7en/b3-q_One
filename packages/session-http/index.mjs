import {createServer} from 'node:http';
export function createSessionHttp({dispatch,maxPathLength=512,allowGovernanceBodies=false,maxBodyBytes=65536}){
 if(!Number.isInteger(maxPathLength)||maxPathLength<512||maxPathLength>8192||!Number.isInteger(maxBodyBytes)||maxBodyBytes<1024||maxBodyBytes>65536||typeof dispatch!=='function')throw Error('Dispatcher required');
 return createServer({maxHeaderSize:16384,requestTimeout:15000,headersTimeout:10000},async(req,res)=>{
 const send=(status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers});res.end(JSON.stringify(body));};
 try{
 for(const name of ['cookie','origin','sec-fetch-site','content-length','host'])if(req.rawHeaders.filter((v,i)=>i%2===0&&v.toLowerCase()===name).length>1){req.resume();return send(400,{error:'Duplicate header'});}
 const governanceBody=allowGovernanceBodies&&req.method==='POST'&&/^\/v1\/control\/plans(?:\/[0-9a-f-]{36}\/approve)?$/.test((req.url??'').split('?')[0]);
 const sizeHeader=req.headers['content-length'];
 if(req.headers['transfer-encoding']||sizeHeader!==undefined&&(!/^(0|[1-9][0-9]*)$/.test(sizeHeader)||Number(sizeHeader)>maxBodyBytes)){req.resume();return send(400,{error:'Invalid body size'});}
 if(!governanceBody&&Number(sizeHeader??0)>0){req.resume();return send(400,{error:'Unexpected body'});}
 let body;
 if(governanceBody){
 if(req.headers['content-type']!=='application/json'){req.resume();return send(415,{error:'JSON required'});}
 const chunks=[];let total=0;
 try{for await(const chunk of req){total+=chunk.length;if(total>maxBodyBytes)throw Error('Body too large');chunks.push(chunk);}
 const raw=new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));body=JSON.parse(raw);
 if(!body||Array.isArray(body)||Object.getPrototypeOf(body)!==Object.prototype)throw Error('Invalid JSON');
 }catch{return send(400,{error:'Invalid JSON body'});}
 }
 if(typeof req.url!=='string'||req.url.length>maxPathLength)return send(400,{error:'Invalid path'});
 const result=await dispatch({method:req.method,path:req.url,headers:req.headers,body});
 send(result.status,result.body,result.headers);
 }catch{if(!res.headersSent)send(503,{error:'Unavailable'});else res.destroy();}
 }).setTimeout(20000,s=>s.destroy());
}
