import test from 'node:test';
import assert from 'node:assert/strict';
import {createTokenExchange} from '../packages/oidc-login/token-exchange.mjs';
const config={tokenEndpoint:'https://identity.example/token',clientId:'one',redirectUri:'https://one.example/callback'};
const input={clientId:'one',redirectUri:config.redirectUri,code:'fixture-code',codeVerifier:'a'.repeat(43)};
const json=v=>new Response(JSON.stringify(v),{headers:{'Content-Type':'application/json'}});
test('exchange binds configured endpoint and PKCE without exposing refresh token',async()=>{const exchange=createTokenExchange({...config,fetcher:async(url,opts)=>{assert.equal(url,config.tokenEndpoint);assert.equal(opts.redirect,'error');assert.equal(opts.body.get('code_verifier'),input.codeVerifier);return json({token_type:'Bearer',access_token:'access',id_token:'identity',refresh_token:'private'});}});assert.deepEqual(await exchange(input),{accessToken:'access',idToken:'identity'});});
test('invalid redirect rejected before network request',async()=>{const exchange=createTokenExchange({...config,fetcher:()=>assert.fail('unexpected request')});await assert.rejects(exchange({...input,redirectUri:'https://other.example/callback'}));});
test('oversized and malformed responses fail closed',async()=>{for(const response of [json({token_type:'Bearer',access_token:'a'.repeat(33000),id_token:'id'}),json({token_type:'Bearer',access_token:'a'}),new Response('private provider error',{status:400})]){const exchange=createTokenExchange({...config,fetcher:async()=>response});await assert.rejects(exchange(input),{message:'Token exchange failed'});}});
