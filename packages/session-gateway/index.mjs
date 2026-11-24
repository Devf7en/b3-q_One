export function createSessionGateway({sessions,gateway,origin}){
 if(typeof sessions?.resolve!=='function'||typeof sessions?.revoke!=='function'||typeof gateway!=='function')throw Error('Trusted dependencies required');
 const url=new URL(origin);if(url.protocol!=='https:'||url.origin!==origin)throw Error('HTTPS origin required');
 const reply=(status,body,headers={})=>({status,body,headers:{'Cache-Control':'no-store',...headers}});
 return async ({method,path,headers={}})=>{
 if(headers.origin!==undefined&&headers.origin!==origin)return reply(403,{error:'Origin denied'});
 if(headers['sec-fetch-site']!==undefined&&!['same-origin','none'].includes(headers['sec-fetch-site']))return reply(403,{error:'Origin denied'});
 if(path==='/session/profile'){
 if(method!=='GET')return reply(405,{error:'Method not allowed'});
 try{const session=await sessions.resolve(headers.cookie,{includeProfile:true});if(!session)return reply(401,{error:'Authentication required'});const p=session.profile;if(!p||typeof p.userId!=='string'||p.tenantId!==session.tenantId||!['viewer','operator','approver'].includes(p.role)||!Number.isFinite(p.expiresAt))return reply(503,{error:'Profile unavailable'});return reply(200,{userId:p.userId,tenantId:p.tenantId,role:p.role,expiresAt:p.expiresAt});}catch{return reply(503,{error:'Profile unavailable'});}
 }
 if(path==='/session/logout'){
 if(method!=='POST')return reply(405,{error:'Method not allowed'});
 if(headers.origin!==origin)return reply(403,{error:'Origin required'});
 const {setCookie}=sessions.revoke(headers.cookie);return reply(200,{signedOut:true},{'Set-Cookie':setCookie});
 }
 if(!/^\/v1\/observatory\/evidence(?:\?[a-z0-9=&-]{1,100})?$/.test(path??''))return reply(404,{error:'Not found'});
 if(method!=='GET')return reply(405,{error:'Method not allowed'});
 try{
 const session=await sessions.resolve(headers.cookie);if(!session)return reply(401,{error:'Authentication required'});
 const result=await gateway({method,path,token:session.token,tenantId:session.tenantId});
 return reply(result.status,result.body);
 }catch{return reply(503,{error:'Request unavailable'});}
 };
}
