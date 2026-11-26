const required=['build','tests','dependency-scan','secret-scan','policy'];
export function evaluateRelease(evidence,findings){
 if(!Array.isArray(evidence)||!Array.isArray(findings))throw Error('Evidence and findings required');
 const blockers=[];
 for(const gate of required){const rows=evidence.filter(e=>e.gate===gate);if(rows.length!==1||rows[0].status!=='pass'||!rows[0].source||!Number.isFinite(Date.parse(rows[0].observed_at)))blockers.push(gate);}
 for(const f of findings){if(!['critical','high','medium','low','info'].includes(f.severity)||!['open','resolved'].includes(f.status)||!f.id||!f.source)blockers.push('invalid-finding');else if(f.status==='open'&&['critical','high'].includes(f.severity))blockers.push('finding:'+f.id);}
 return {state:'demonstration',decision:blockers.length?'blocked':'eligible-for-review',blockers,authorizationRequired:true,executable:false};
}
export function summarizeFindings(findings){const counts={critical:0,high:0,medium:0,low:0,info:0};for(const f of findings){if(!Object.hasOwn(counts,f.severity))throw Error('Invalid severity');if(f.status==='open')counts[f.severity]++;}return counts;}
