import {randomBytes,createHash} from 'node:crypto';
const random=()=>randomBytes(32).toString('base64url');
const hash=v=>createHash('sha256').update(v).digest('base64url');
export function createLoginFlow({authorizationEndpoint,clientId,redirectUri,exchange,verifyIdentity,sessions,clock=Date.now,maxPending=1000}){
 for(const value of [authorizationEndpoint,redirectUri]){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.hash||u.search)throw Error('Invalid endpoint');}
 if(!clientId||typeof exchange!=='function'||typeof verifyIdentity!=='function'||typeof sessions?.issue!=='function'||!Number.isSafeInteger(maxPending)||maxPending<1||maxPending>10000)throw Error('Invalid configuration');
 const pending=new Map(),ttl=300000;
 const cookie=(v,age)=>'__Host-one_login='+v+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+age;
 function sweep(){for(const [k,v] of pending)if(v.expires<=clock())pending.delete(k);}
 return Object.freeze({
 begin(tenantId){
 if(!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(tenantId??''))throw Error('Invalid tenant');
 sweep();if(pending.size>=maxPending)throw Error('Login capacity reached');
 const state=random(),nonce=random(),verifier=random(),binding=random();
 pending.set(hash(state),{nonce,verifier,binding:hash(binding),tenantId,expires:clock()+ttl});
 const u=new URL(authorizationEndpoint);u.search=new URLSearchParams({response_type:'code',client_id:clientId,redirect_uri:redirectUri,scope:'openid',state,nonce,code_challenge:hash(verifier),code_challenge_method:'S256'});
 return {location:u.href,setCookie:cookie(binding,300)};
 },
 async complete({state,code,binding}){
 sweep();if(![state,binding].every(v=>typeof v==='string'&&/^[A-Za-z0-9_-]{43}$/.test(v))||typeof code!=='string'||!code||code.length>4096)throw Error('Invalid callback');
 const k=hash(state),p=pending.get(k);if(!p||p.binding!==hash(binding))throw Error('Invalid login state');pending.delete(k);
 const tokens=await exchange({code,codeVerifier:p.verifier,redirectUri,clientId});
 const identity=await verifyIdentity(tokens,{nonce:p.nonce,clientId});
 if(!identity?.sub||identity.nonce!==p.nonce||typeof tokens?.accessToken!=='string')throw Error('Invalid identity');
 const issued=await sessions.issue({token:tokens.accessToken,tenantId:p.tenantId,expectedSubject:identity.sub});
 return {...issued,clearLoginCookie:cookie('',0)};
 }
 });
}
