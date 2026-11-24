import {createRemoteJWKSet,jwtVerify} from 'jose';
export function createOidcVerifier({issuer,audience,jwksUri}){
 for(const value of [issuer,jwksUri]){const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.hash)throw Error('HTTPS identity configuration required');}
 if(typeof audience!=='string'||!audience.trim())throw Error('Audience required');
 const keys=createRemoteJWKSet(new URL(jwksUri),{timeoutDuration:5000,cooldownDuration:30000,cacheMaxAge:600000});
 return async(token,expected)=>{
 if(expected?.issuer!==issuer||expected?.audience!==audience||typeof token!=='string'||token.length>8192)throw Error('Unauthorized');
 const {payload}=await jwtVerify(token,keys,{issuer,audience,algorithms:['RS256'],requiredClaims:['iss','aud','sub','exp','iat'],typ:'at+jwt',maxTokenAge:'15m'});
 return payload;
 };
}
