export function createTokenExchange({tokenEndpoint,clientId,redirectUri,fetcher=fetch}){
 for(const v of [tokenEndpoint,redirectUri]){const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password||u.hash||u.search)throw Error('Invalid endpoint');}
 if(typeof clientId!=='string'||!clientId||typeof fetcher!=='function')throw Error('Invalid configuration');
 return async function exchange(input){
 if(input.clientId!==clientId||input.redirectUri!==redirectUri||typeof input.code!=='string'||!input.code||input.code.length>4096||!/^[A-Za-z0-9_-]{43}$/.test(input.codeVerifier??''))throw Error('Invalid exchange');
 try{
 const response=await fetcher(tokenEndpoint,{method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(5000),headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams({grant_type:'authorization_code',client_id:clientId,redirect_uri:redirectUri,code:input.code,code_verifier:input.codeVerifier})});
 if(!response.ok||!response.headers.get('content-type')?.toLowerCase().startsWith('application/json')||!response.body)throw Error();
 const reader=response.body.getReader();let size=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32768){await reader.cancel();throw Error();}chunks.push(value);}}finally{reader.releaseLock();}
 const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
 if(typeof data.token_type!=='string'||data.token_type.toLowerCase()!=='bearer'||![data.access_token,data.id_token].every(v=>typeof v==='string'&&v.length>0&&v.length<=8192))throw Error();
 return {accessToken:data.access_token,idToken:data.id_token};
 }catch{throw Error('Token exchange failed');}
 };
}
