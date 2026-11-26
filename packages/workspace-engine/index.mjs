import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../contracts/workspaces.json',import.meta.url)));
export const workspaces=Object.freeze(registry.workspaces.map(w=>Object.freeze({...w,panels:Object.freeze([...w.panels])})));
export function createSession({tenantId,userId,projectId=null,resourceId=null,workspaceId='W01',theme='system'}){
 if(!tenantId||!userId) throw new Error('Tenant and user required');
 if(!workspaces.some(w=>w.id===workspaceId)) throw new Error('Unknown workspace');
 if(!['light','dark','system'].includes(theme)) throw new Error('Unknown theme');
 return Object.freeze({tenantId,userId,projectId,resourceId,workspaceId,theme});
}
export function switchWorkspace(session,workspaceId){return createSession({...session,workspaceId});}
export function switchTheme(session,theme){return createSession({...session,theme});}
export function layoutKey(session){return JSON.stringify([session.tenantId,session.userId,session.workspaceId]);}
export function getPanels(session){return workspaces.find(w=>w.id===session.workspaceId)?.panels??[];}
// Presentation state only. This module does not authorize operations or persist secrets.
