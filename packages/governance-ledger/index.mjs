import {createHash} from 'node:crypto';
import {authorize} from '../runtime-policy/index.mjs';
// Versioned canonical JSON encoding for JSON-only manifests.
export function canonical(value){
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value);
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
 if(Array.isArray(value)){if(Object.keys(value).length!==value.length)throw Error('Invalid array');return '['+Array.from(value,canonical).join(',')+']';}
 if(value&&Object.getPrototypeOf(value)===Object.prototype)return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 throw Error('JSON manifest required');
}
const hash=v=>createHash('sha256').update(canonical(v)).digest('hex');
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
export function createPlan({principal,project,id,version,manifest,surface}){
 if(!authorize({principal,resource:project,action:'plan.create',surface})||!nonempty(project.id)||!nonempty(id)||!Number.isSafeInteger(version)||version<1||!manifest||typeof manifest!=='object'||Array.isArray(manifest))throw Error('Plan denied or invalid');
 const payload={format:'one-plan-v1',tenantId:principal.tenantId,projectId:project.id,id,version,createdBy:principal.userId,manifest:JSON.parse(canonical(manifest))};
 return {...payload,digest:hash(payload)};
}
export function verifyPlan(plan){
 try{const {digest,...payload}=plan;return payload.format==='one-plan-v1'&&digest===hash(payload);}catch{return false;}
}
export function approvePlan({principal,plan,expectedDigest,surface}){
 if(!verifyPlan(plan)||expectedDigest!==plan.digest||!authorize({principal,resource:plan,action:'plan.approve',surface}))throw Error('Approval denied');
 return Object.freeze({tenantId:plan.tenantId,planId:plan.id,version:plan.version,digest:plan.digest,createdBy:plan.createdBy,approvedBy:principal.userId,executable:false});
}
