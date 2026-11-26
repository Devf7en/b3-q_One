import {createHash} from 'node:crypto';
import {canonical} from '../governance-ledger/index.mjs';
const hash=v=>createHash('sha256').update(canonical(v)).digest('hex');
const str=v=>typeof v==='string'&&v.trim().length>0;
const hex=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const time=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
export function auditEvent({principal,id,action,correlationId,planDigest=null,outcome,recordedAt,previous=null}){
 if(!principal||!str(principal.tenantId)||!str(principal.userId)||![id,action,correlationId].every(str)||!['allowed','denied','failed','completed'].includes(outcome)||!time(recordedAt)||(planDigest!==null&&!hex(planDigest)))throw Error('Invalid audit event');
 if(previous&&(!verifyEvent(previous)||previous.tenantId!==principal.tenantId||previous.recordedAt>recordedAt||!Number.isSafeInteger(previous.sequence+1)))throw Error('Invalid predecessor');
 const payload={format:'one-audit-v1',tenantId:principal.tenantId,actorId:principal.userId,id,action,correlationId,planDigest,outcome,recordedAt,sequence:previous?previous.sequence+1:1,previousDigest:previous?previous.digest:null};
 return Object.freeze({...payload,digest:hash(payload)});
}
export function verifyEvent(event){try{const {digest,...payload}=event;return payload.format==='one-audit-v1'&&hex(digest)&&hash(payload)===digest;}catch{return false;}}
export function verifyChain(events,tenantId,expectedHead){
 if(!Array.isArray(events)||!str(tenantId)||!hex(expectedHead)||!events.length)return false;
 const ids=new Set();let previous=null;
 for(const e of events){if(!verifyEvent(e)||e.tenantId!==tenantId||!str(e.id)||ids.has(e.id)||e.sequence!==(previous?previous.sequence+1:1)||e.previousDigest!==(previous?previous.digest:null)||!time(e.recordedAt)||(previous&&e.recordedAt<previous.recordedAt))return false;ids.add(e.id);previous=e;}
 return previous.digest===expectedHead;
}
export function evidenceFreshness({source,observedAt,state},{now,maxAgeMs}){
 if(!str(source)||!time(now)||!Number.isSafeInteger(maxAgeMs)||maxAgeMs<0||!['live','cached','unavailable','demonstration'].includes(state))throw Error('Invalid evidence');
 if(state==='unavailable'||state==='demonstration')return {state,freshness:'not-applicable',verified:false};
 if(!time(observedAt)||Date.parse(observedAt)>Date.parse(now))return {state:'unavailable',freshness:'invalid',verified:false};
 const ageMs=Date.parse(now)-Date.parse(observedAt);
 return {state,freshness:ageMs<=maxAgeMs?'fresh':'stale',ageMs,verified:false};
}
