// Server-only boundary. Dependencies must verify tokens and query authoritative membership.
export function createIdentityBoundary({verifyToken,findMembership,issuer,audience,clock=()=>Date.now()}){
 if(typeof verifyToken!=='function'||typeof findMembership!=='function'||!issuer||!audience)throw Error('Identity configuration required');
 return async function authenticate(token,tenantId){
 if(typeof token!=='string'||!token.trim()||typeof tenantId!=='string'||!tenantId.trim())throw Error('Unauthorized');
 const claims=await verifyToken(token,{issuer,audience});
 if(!claims||claims.iss!==issuer||!(Array.isArray(claims.aud)?claims.aud.includes(audience):claims.aud===audience)||typeof claims.sub!=='string'||!claims.sub.trim()||!Number.isFinite(claims.exp)||claims.exp<=clock()/1000)throw Error('Unauthorized');
 const membership=await findMembership({issuer,subject:claims.sub,tenantId});
 if(!membership||membership.tenantId!==tenantId||typeof membership.userId!=='string'||!membership.userId.trim()||!['viewer','operator','approver'].includes(membership.role))throw Error('Unauthorized');
 return Object.freeze({userId:membership.userId,tenantId,role:membership.role});
 };
}
