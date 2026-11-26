import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,SignJWT} from 'jose';
import {createHash} from 'node:crypto';
import {createIdTokenVerifier} from '../packages/oidc-login/id-token.mjs';
const issuer='https://identity.example',clientId='one',nonce='n'.repeat(43),accessToken='fixture-access';
const {publicKey,privateKey}=await generateKeyPair('RS256');
const wrong=await generateKeyPair('RS256');
const jwk={...await exportJWK(publicKey),kid:'fixture',alg:'RS256',use:'sig'};
const verify=createIdTokenVerifier({issuer,clientId,jwksUri:issuer+'/jwks',fetcher:async()=>new Response(JSON.stringify({keys:[jwk]}),{headers:{'Content-Type':'application/json'}})});
const at_hash=createHash('sha256').update(accessToken).digest().subarray(0,16).toString('base64url');
const now=Math.floor(Date.now()/1000);
const claims={iss:issuer,aud:clientId,sub:'fixture-user',nonce,iat:now,exp:now+120,at_hash};
const sign=(overrides={},key=privateKey)=>new SignJWT({...claims,...overrides}).setProtectedHeader({alg:'RS256',kid:'fixture'}).sign(key);
const expected={clientId,nonce};
const valid=await sign();
assert.deepEqual(await verify({idToken:valid,accessToken},expected),{sub:'fixture-user',nonce});
for(const overrides of [{iss:'https://wrong.example'},{aud:'wrong'},{nonce:'wrong'},{exp:now-10},{iat:now-600},{aud:[clientId,'other']},{azp:'other'},{at_hash:'wrong'}]){
 await assert.rejects(verify({idToken:await sign(overrides),accessToken},expected),{message:'Identity verification failed'});
}
await assert.rejects(verify({idToken:await sign({},wrong.privateKey),accessToken},expected));
await assert.rejects(verify({idToken:valid,accessToken:'wrong'},expected));
await assert.rejects(verify({idToken:valid,accessToken},{...expected,nonce:'x'.repeat(43)}));
console.log('Signed ID token acceptance passed');
