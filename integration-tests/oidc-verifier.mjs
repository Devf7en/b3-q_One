import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,SignJWT,customFetch} from 'jose';
import {createOidcVerifier} from '../packages/oidc-verifier/index.mjs';
// Configuration rejection is tested without external network access.
assert.throws(()=>createOidcVerifier({issuer:'http://issuer.example',audience:'one',jwksUri:'https://issuer.example/jwks'}));
const verify=createOidcVerifier({issuer:'https://issuer.example',audience:'one',jwksUri:'https://issuer.example/jwks'});
await assert.rejects(verify('invalid',{issuer:'https://other.example',audience:'one'}));
await assert.rejects(verify('invalid',{issuer:'https://issuer.example',audience:'one'}));
console.log('OIDC configuration and malformed token rejection passed');
