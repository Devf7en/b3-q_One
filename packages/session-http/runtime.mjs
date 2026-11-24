import {createLoginGateway} from '../oidc-login/gateway.mjs';
import {createSessionGateway} from '../session-gateway/index.mjs';
import {createSessionHttp} from './index.mjs';
export function createSessionRuntime({flow,sessions,gateway,origin,tenantId,enableGovernance=false}){
 const login=createLoginGateway({flow,origin,tenantId});
 const session=createSessionGateway({sessions,gateway,origin,enableGovernance});
 const host=new URL(origin).host;
 const dispatch=async request=>{
 const deny=(status,error)=>({status,body:{error},headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 if(request.headers?.host!==host)return deny(403,'Host denied');
 const path=request.path;
 if(typeof path!=='string'||path.length>8192||!path.startsWith('/')||path.startsWith('//')||path.includes('\\')||path.includes('#'))return deny(400,'Invalid path');
 const route=path.split('?')[0];
 if(path==='/session/capabilities'){if(request.method!=='GET')return deny(405,'Method not allowed');if(request.headers.origin!==undefined&&request.headers.origin!==origin)return deny(403,'Origin denied');if(request.headers['sec-fetch-site']&&!['same-origin','none'].includes(request.headers['sec-fetch-site']))return deny(403,'Origin denied');return {status:200,body:{format:'one-session-capabilities-v1',login:true},headers:{'Cache-Control':'no-store'}};}
 if(route==='/session/login'||route==='/session/callback')return login(request);
 if(route==='/session/profile'||route==='/session/logout'||route==='/v1/observatory/evidence'||enableGovernance&&/^\/v1\/control\/(?:projects|plans(?:\/[0-9a-f-]{36}\/approve)?)$/.test(route))return session(request);
 return deny(404,'Not found');
 };
 return {dispatch,server:createSessionHttp({dispatch,maxPathLength:8192,allowGovernanceBodies:enableGovernance})};
}
