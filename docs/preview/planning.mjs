function integer(n){if(!Number.isSafeInteger(n)||n<0)throw Error('Expected nonnegative safe integer');return n;}
export function forecastCost({monthlyCents,additionalCents,budgetCents,months}){
 [monthlyCents,additionalCents,budgetCents,months].forEach(integer);if(months<1||months>120)throw Error('Invalid horizon');
 const projectedMonthly=integer(monthlyCents+additionalCents),total=integer(projectedMonthly*months);
 return {projectedMonthly,total,overBudget:projectedMonthly>budgetCents,currency:'USD',unit:'cents',state:'simulation'};
}
export function simulateCapacity({capacity,demand,additionalDemand,lostCapacity}){
 [capacity,demand,additionalDemand,lostCapacity].forEach(integer);if(lostCapacity>capacity)throw Error('Loss exceeds capacity');
 const remaining=capacity-lostCapacity,projected=integer(demand+additionalDemand);
 return {remaining,projected,headroom:remaining-projected,feasible:remaining>=projected,utilization:remaining?projected/remaining:null,state:'simulation'};
}
export function assessRecovery({rpoMinutes,rtoMinutes,backupAgeMinutes,restoreMinutes,restoreVerified}){
 [rpoMinutes,rtoMinutes,backupAgeMinutes,restoreMinutes].forEach(integer);
 const blockers=[];if(backupAgeMinutes>rpoMinutes)blockers.push('rpo');if(restoreMinutes>rtoMinutes)blockers.push('rto');if(restoreVerified!==true)blockers.push('restore-evidence');
 return {blockers,decision:blockers.length?'blocked':'eligible-for-review',state:'simulation',executable:false};
}
