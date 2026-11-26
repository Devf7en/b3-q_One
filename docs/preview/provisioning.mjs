import {composeFactory} from './application-factory/index.mjs';
import {forecastCost,simulateCapacity,assessRecovery} from './infrastructure-planning/index.mjs';
import {evaluateRelease} from './security-governance/index.mjs';
import {planWorkflow} from './orchestration/index.mjs';
export function planProvisioning(catalog,input){
 if(typeof input?.intent!=='string'||!input.intent.trim()||input.intent.length>4000)throw Error('Explicit intent required');
 const composition=composeFactory(catalog,input);
 const cost=forecastCost(input.cost),capacity=simulateCapacity(input.capacity),recovery=assessRecovery(input.recovery),security=evaluateRelease(input.securityEvidence,input.findings);
 const workflow=planWorkflow([{id:'inspect',kind:'read',dependsOn:[]},{id:'review',kind:'read',dependsOn:['inspect']},{id:'provision',kind:'change',dependsOn:['review']},{id:'verify',kind:'read',dependsOn:['provision']}]);
 const blockers=[...(cost.overBudget?['cost:budget']:[]),...(!capacity.feasible?['capacity:shortfall']:[]),...recovery.blockers.map(x=>'recovery:'+x),...security.blockers.map(x=>'security:'+x)];
 return {version:'0.1.0',intent:input.intent,composition,cost,capacity,recovery,security,workflow,blockers,decision:blockers.length?'blocked':'eligible-for-simulation-review',unverified:['component-dependencies','provider-availability','artifact-identity','evidence-freshness','authorization','approval'],state:'simulation',executable:false};
}
