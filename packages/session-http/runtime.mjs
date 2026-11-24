import {createLoginGateway} from '../oidc-login/gateway.mjs';
import {createSessionGateway} from '../session-gateway/index.mjs';
import {createSessionHttp} from './index.mjs';
export function createSessionRuntime({flow,sessions,gateway,origin,tenantId}){
 const login=createLoginGateway({flow,origin,tenantId});
 const session=createSessionGateway({sessions,gateway,origin});
 const host=new URL(origin).host;
 const dispatch=async request=>{
 const deny=(status,error)=>({status,body:{error},headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
 if(request.headers?.host!==host)return deny(403,'Host denied');
 const path=request.path;
 if(typeof path!=='string'||path.length>8192||!path.startsWith('/')||path.startsWith('//')||path.includes('\\')||path.includes('#'))return deny(400,'Invalid path');
 const route=path.split('?')[0];
 if(route==='/session/login'||route==='/session/callback')return login(request);
 if(route==='/session/profile'||route==='/session/logout'||route==='/v1/observatory/evidence')return session(request);
 return deny(404,'Not found');
 };
 return {dispatch,server:createSessionHttp({dispatch,maxPathLength:8192})};
}
