// Trusted host-side collector only; never mount a Docker socket in the web application.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const commands=Object.freeze({containers:['container','ls','--all','--no-trunc','--format','{{json .}}'],images:['image','ls','--no-trunc','--format','{{json .}}'],networks:['network','ls','--no-trunc','--format','{{json .}}'],volumes:['volume','ls','--format','{{json .}}']});
const fields={containers:['ID','Image','Names','State','Status','Networks'],images:['ID','Repository','Tag','Size'],networks:['ID','Name','Driver','Scope'],volumes:['Name','Driver','Scope']};
export function createDockerInventory({execute=async args=>(await run('docker',args,{timeout:10000,maxBuffer:2097152,windowsHide:true})).stdout,clock=()=>new Date().toISOString()}={}){
 return async function collect(kind){
 if(!Object.hasOwn(commands,kind))throw Error('Unsupported inventory');
 try{
 const raw=await execute([...commands[kind]]);
 if(typeof raw!=='string'||Buffer.byteLength(raw)>2097152)throw Error('Invalid inventory');
 const rows=raw.split(/\r?\n/).filter(x=>x.trim()).map(line=>{
 const item=JSON.parse(line);
 if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Invalid record');
 return Object.fromEntries(fields[kind].filter(k=>typeof item[k]==='string').map(k=>[k,item[k].slice(0,1024)]));
 });
 return {providerId:'local-docker',source:'docker-cli:'+kind,observed_at:clock(),state:'live',records:rows,executable:false};
 }catch{return {providerId:'local-docker',source:'docker-cli:'+kind,observed_at:null,state:'unavailable',records:[],executable:false};}
 };
}
