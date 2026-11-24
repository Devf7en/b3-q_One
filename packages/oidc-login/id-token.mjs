import {createRemoteJWKSet,jwtVerify,customFetch} from 'jose';
import {createHash,timingSafeEqual} from 'node:crypto';
export function createIdTokenVerifier({issuer,clientId,jwksUri,fetcher}){
 for(const v of [issuer,jwksUri]){const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||u.hash||u.search)throw Error('Invalid identity endpoint');}
 if(typeof clientId!=='string'||!clientId)throw Error('Client required');
 const keys=createRemoteJWKSet(new URL(jwksUri),{timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000,[customFetch]:(url,opts)=> (fetcher??fetch)(url,{...opts,redirect:'error'})});
 return async(tokens,expected)=>{
 try{
 if(expected?.clientId!==clientId||!/^[A-Za-z0-9_-]{43}$/.test(expected?.nonce??'')||![tokens?.idToken,tokens?.accessToken].every(v=>typeof v==='string'&&v.length>0&&v.length<=8192))throw Error();
 const {payload:p}=await jwtVerify(tokens.idToken,keys,{issuer,audience:clientId,algorithms:['RS256'],requiredClaims:['iss','aud','sub','exp','iat','nonce'],maxTokenAge:'5m'});
 if(typeof p.sub!=='string'||!p.sub||p.sub.length>255||p.nonce!==expected.nonce||((Array.isArray(p.aud)&&p.aud.length>1)||p.azp!==undefined)&&p.azp!==clientId)throw Error();
 if(p.at_hash!==undefined){const actual=createHash('sha256').update(tokens.accessToken).digest().subarray(0,16).toString('base64url');if(typeof p.at_hash!=='string'||Buffer.byteLength(p.at_hash)!==Buffer.byteLength(actual)||!timingSafeEqual(Buffer.from(p.at_hash),Buffer.from(actual)))throw Error();}
 return {sub:p.sub,nonce:p.nonce};
 }catch{throw Error('Identity verification failed');}
 };
}
