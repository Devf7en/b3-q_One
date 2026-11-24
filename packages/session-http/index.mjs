import {createServer} from 'node:http';
export function createSessionHttp({dispatch}){
 if(typeof dispatch!=='function')throw Error('Dispatcher required');
 return createServer({maxHeaderSize:16384,requestTimeout:15000,headersTimeout:10000},async(req,res)=>{
 const send=(status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(body));};
 try{
 for(const name of ['cookie','origin','sec-fetch-site','content-length','host'])if(req.rawHeaders.filter((v,i)=>i%2===0&&v.toLowerCase()===name).length>1){req.resume();return send(400,{error:'Duplicate header'});}
 if(req.headers['transfer-encoding']||Number(req.headers['content-length']??0)>0){req.resume();return send(400,{error:'Unexpected body'});}
 if(typeof req.url!=='string'||req.url.length>512)return send(400,{error:'Invalid path'});
 const result=await dispatch({method:req.method,path:req.url,headers:req.headers});
 send(result.status,result.body,result.headers);
 }catch{if(!res.headersSent)send(503,{error:'Unavailable'});else res.destroy();}
 }).setTimeout(20000,s=>s.destroy());
}
