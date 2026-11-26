export function createLoginGateway({flow,origin,tenantId}){
 const u=new URL(origin);if(u.protocol!=='https:'||u.origin!==origin||!flow?.begin||!flow?.complete||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(tenantId??''))throw Error('Invalid login configuration');
 const clear='__Host-one_login=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0';
 const reply=(status,body,headers={})=>({status,body,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...headers}});
 return async({method,path,headers={}})=>{
 if(typeof path!=='string'||path.length>8192||!path.startsWith('/')||path.startsWith('//'))return reply(400,{error:'Invalid request'});
 const url=new URL(path,origin);
 if(url.origin!==origin)return reply(400,{error:'Invalid request'});
 if(url.pathname==='/session/login'){
 if(method!=='POST')return reply(405,{error:'Method not allowed'});
 if(url.search||headers.origin!==origin||(headers['sec-fetch-site']&&!['same-origin','none'].includes(headers['sec-fetch-site'])))return reply(403,{error:'Origin denied'});
 try{const result=flow.begin(tenantId);return reply(303,null,{Location:result.location,'Set-Cookie':result.setCookie});}catch{return reply(503,{error:'Login unavailable'});}
 }
 if(url.pathname!=='/session/callback')return reply(404,{error:'Not found'});
 if(method!=='GET')return reply(405,{error:'Method not allowed'});
 try{
 if(url.searchParams.has('error')||url.searchParams.getAll('state').length!==1||url.searchParams.getAll('code').length!==1)throw Error();
 const cookies=typeof headers.cookie==='string'&&headers.cookie.length<=8192?headers.cookie.split(';').map(v=>v.trim()).filter(v=>v.startsWith('__Host-one_login=')):[];
 if(cookies.length!==1)throw Error();
 const result=await flow.complete({state:url.searchParams.get('state'),code:url.searchParams.get('code'),binding:cookies[0].slice('__Host-one_login='.length)});
 return reply(303,null,{Location:origin+'/','Set-Cookie':[result.setCookie,result.clearLoginCookie]});
 }catch{return reply(400,{error:'Authentication failed'},{'Set-Cookie':clear});}
 };
}
