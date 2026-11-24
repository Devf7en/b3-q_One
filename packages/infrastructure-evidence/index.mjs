import {createHash} from 'node:crypto';
import {canonical} from '../governance-ledger/index.mjs';
const fields={containers:['ID','Image','Names','State','Status','Networks'],images:['ID','Repository','Tag','Size'],networks:['ID','Name','Driver','Scope'],volumes:['Name','Driver','Scope']};
const valid=v=>typeof v==='string'&&v.trim()&&v.length<=256;
const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
// Ownership assignments and host identity must originate from trusted server configuration.
export function normalizeInventory({snapshot,hostId,tenantId,projectId,assignments,now,maxAgeMs=300000}){
 if(![hostId,tenantId,projectId].every(valid)||!Array.isArray(assignments)||!timestamp(now)||!Number.isSafeInteger(maxAgeMs)||maxAgeMs<0)throw Error('Invalid evidence context');
 const kind=typeof snapshot?.source==='string'?snapshot.source.split(':')[1]:null;
 if(snapshot?.providerId!=='local-docker'||!Object.hasOwn(fields,kind)||snapshot.source!=='docker-cli:'+kind||snapshot.executable!==false)throw Error('Invalid snapshot');
 const base={providerId:'local-docker',hostId,tenantId,projectId,source:snapshot.source,executable:false};
 if(snapshot.state==='unavailable')return {...base,state:'unavailable',observed_at:null,freshness:'not-applicable',records:[]};
 if(snapshot.state!=='live'||!timestamp(snapshot.observed_at)||Date.parse(snapshot.observed_at)>Date.parse(now)||!Array.isArray(snapshot.records)||snapshot.records.length>20000)throw Error('Invalid observation');
 const ageMs=Date.parse(now)-Date.parse(snapshot.observed_at);
 const records=[],seen=new Set();
 for(const row of snapshot.records){
 if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Invalid record');
 const ref=kind==='volumes'?row.Name:row.ID;
 if(!valid(ref))continue;
 const matches=assignments.filter(a=>a.hostId===hostId&&a.kind===kind&&a.ref===ref);
 if(matches.length!==1||matches[0].tenantId!==tenantId||matches[0].projectId!==projectId||!valid(matches[0].resourceId)||seen.has(ref))continue;
 seen.add(ref);
 const attributes=Object.fromEntries(fields[kind].filter(k=>typeof row[k]==='string').map(k=>[k,row[k].slice(0,1024)]));
 // Cross-resource names may reveal other tenants; omit unverified relationships.
 delete attributes.Networks;delete attributes.Image;
 records.push({resourceId:matches[0].resourceId,kind,ref,attributes});
 }
 const payload={...base,state:ageMs>maxAgeMs?'cached':'live',observed_at:snapshot.observed_at,freshness:ageMs>maxAgeMs?'stale':'fresh',records};
 return {...payload,digest:createHash('sha256').update(canonical(payload)).digest('hex')};
}
