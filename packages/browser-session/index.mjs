import {randomBytes,createHash} from 'node:crypto';
const name='__Host-one_session';
const digest=id=>createHash('sha256').update(id).digest('hex');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function createBrowserSessions({authenticate,clock=Date.now,ttlMs=300000,maxSessions=1000}={}){
 if(typeof authenticate!=='function'||!Number.isSafeInteger(ttlMs)||ttlMs<1000||ttlMs>900000||!Number.isSafeInteger(maxSessions)||maxSessions<1||maxSessions>10000)throw Error('Invalid session configuration');
 const sessions=new Map();
 const cookie=(id,age)=>name+'='+id+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+age;
 function key(header){if(typeof header!=='string'||header.length>8192)return null;const values=header.split(';').map(s=>s.trim()).filter(s=>s.startsWith(name+'='));if(values.length!==1)return null;const id=values[0].slice(name.length+1);return /^[a-f0-9]{64}$/.test(id)?digest(id):null;}
 function sweep(now){for(const [k,v] of sessions)if(v.expiresAt<=now)sessions.delete(k);}
 return Object.freeze({
 async issue({token,tenantId,expectedSubject}){
 if(typeof token!=='string'||!token||token.length>8192||!uuid.test(tenantId??''))throw Error('Invalid session input');
 const principal=await authenticate(token,tenantId,expectedSubject);
 if(!principal||principal.tenantId!==tenantId||!principal.userId)throw Error('Unauthorized');
 const now=clock();sweep(now);if(sessions.size>=maxSessions)throw Error('Session capacity reached');
 const id=randomBytes(32).toString('hex');sessions.set(digest(id),{token,tenantId,userId:principal.userId,expiresAt:now+ttlMs});
 return {setCookie:cookie(id,Math.floor(ttlMs/1000)),expiresAt:now+ttlMs};
 },
 async resolve(header){
 const k=key(header),now=clock();sweep(now);const s=sessions.get(k);if(!s)return null;
 try{const p=await authenticate(s.token,s.tenantId);if(!p||p.tenantId!==s.tenantId||p.userId!==s.userId||sessions.get(k)!==s||clock()>=s.expiresAt)throw Error('Unauthorized');return {token:s.token,tenantId:s.tenantId};}catch{sessions.delete(k);return null;}
 },
 revoke(header){const k=key(header);if(k)sessions.delete(k);return {setCookie:cookie('',0)};}
 });
}
