const tabs=['Properties','Details','Configuration','Tools','Actions','Relationships','Workflows','Intelligence','Security','Observability','History','Documentation'];
const fixtures=[{id:'srv-001',name:'Application Server',kind:'Compute',cpu:4,ram:8,port:443,backup:true},{id:'db-001',name:'PostgreSQL',kind:'Database',cpu:2,ram:8,port:5432,backup:true},{id:'ctr-001',name:'Container Runtime',kind:'Container',cpu:2,ram:4,port:8080,backup:false}];
const specialized={
 command:{id:'cmd-001',name:'Demo command policy',kind:'Command policy',fields:[['timeout','Timeout seconds',1,3600,60],['review','Independent review required',null,null,true]]},
 infrastructure:{id:'infra-001',name:'Demo compute node',kind:'Compute',fields:[['cpu','Virtual CPUs',1,32,4],['ram','Memory GB',1,64,8],['port','Service port',1,65535,443],['backup','Automated backup',null,null,true]]},
 provisioning:{id:'prov-001',name:'Demo provisioning plan',kind:'Provisioning',fields:[['instances','Requested instances',1,100,2],['review','Independent review required',null,null,true]]},
 hosting:{id:'host-001',name:'Demo hosting allocation',kind:'Hosting',fields:[['storage','Storage GB',1,10000,20],['tls','TLS required',null,null,true]]},
 developer:{id:'dev-001',name:'Demo build pipeline',kind:'Pipeline',fields:[['timeout','Build timeout minutes',1,120,15],['tests','Tests required',null,null,true]]},
 security:{id:'sec-001',name:'Demo security policy',kind:'Security policy',fields:[['session','Session lifetime minutes',1,60,15],['mfa','MFA required',null,null,true]]},
 observability:{id:'obs-001',name:'Demo evidence policy',kind:'Evidence policy',fields:[['freshness','Freshness threshold seconds',1,86400,300],['alerts','Alerts enabled',null,null,false]]},
 resilience:{id:'res-001',name:'Demo recovery policy',kind:'Recovery policy',fields:[['rpo','Recovery point objective minutes',1,10080,1440],['rto','Recovery time objective minutes',1,10080,120],['restoreTest','Restore test required',null,null,true]]},
 finops:{id:'fin-001',name:'Demo monthly budget',kind:'Budget',fields:[['budget','Monthly budget USD cents',0,100000000,25000],['alert','Budget alerts enabled',null,null,true]]},
 business:{id:'biz-001',name:'Demo subscription policy',kind:'Subscription',fields:[['seats','Seat allocation',1,10000,10],['renewal','Automatic renewal',null,null,false]]},
 marketplace:{id:'mkt-001',name:'Demo catalog listing',kind:'Catalog listing',fields:[['price','Unit price USD cents',0,100000000,0],['published','Proposed publication',null,null,false]]},
 domains:{id:'dns-001',name:'example.invalid',kind:'Domain',fields:[['ttl','DNS TTL seconds',60,86400,900],['autoRenew','Automatic renewal',null,null,false]]},
 containers:{id:'ctr-002',name:'Demo container',kind:'Container',fields:[['replicas','Replicas',0,32,2],['port','Service port',1,65535,8080]]},
 data:{id:'db-002',name:'Demo database',kind:'Database',fields:[['connections','Connection limit',1,1000,100],['backup','Automated backup',null,null,true]]},
 automation:{id:'wf-001',name:'Demo workflow',kind:'Workflow',fields:[['timeout','Timeout seconds',1,3600,60],['enabled','Enabled',null,null,false]]},
 intelligence:{id:'agent-001',name:'Demo agent',kind:'AI Agent',fields:[['budget','Budget micro-USD',0,1000000,100],['review','Human review required',null,null,true]]}
};
const operations={
 command:['Review command policy','Propose command policy change'],
 infrastructure:['Inspect compute allocation','Propose capacity change'],
 provisioning:['Review provisioning requirements','Propose provisioning plan'],
 hosting:['Inspect hosting allocation','Propose hosting configuration'],
 domains:['Inspect DNS configuration','Propose DNS change'],
 containers:['Inspect runtime configuration','Propose replica change'],
 developer:['Review pipeline configuration','Propose build policy change'],
 data:['Inspect database configuration','Propose connection policy change'],
 automation:['Review workflow configuration','Propose workflow revision'],
 intelligence:['Review agent constraints','Propose agent policy change'],
 security:['Review security policy','Propose security policy revision'],
 observability:['Review freshness policy','Propose evidence policy change'],
 resilience:['Review recovery objectives','Propose restore exercise'],
 finops:['Review budget allocation','Propose budget revision'],
 business:['Review subscription policy','Propose seat allocation'],
 marketplace:['Review catalog configuration','Propose listing revision']
};
const relationships=[
 ['command','security','governed-by'],['infrastructure','finops','budgeted-by'],['provisioning','infrastructure','allocates'],['hosting','infrastructure','depends-on'],['domains','hosting','routes-to'],['containers','infrastructure','runs-on'],['developer','containers','targets'],['data','infrastructure','runs-on'],['automation','provisioning','orchestrates'],['intelligence','automation','proposes-to'],['security','observability','monitored-by'],['observability','infrastructure','observes'],['resilience','data','protects'],['finops','business','allocated-to'],['business','marketplace','consumes'],['marketplace','hosting','offers']
];
// Only explicit operational dependencies propagate a modeled outage.
export function modeledImpact(root,edges=relationships){
 if(!Object.hasOwn(specialized,root))throw new Error('Unknown environment');
 const propagating=new Set(['depends-on','runs-on','routes-to']);
 const seen=new Set([root]),queue=[[root]],affected=[];
 for(let i=0;i<queue.length;i++){const path=queue[i],current=path[path.length-1];for(const [from,to,type] of edges){if(to!==current||!propagating.has(type)||seen.has(from)||!Object.hasOwn(specialized,from))continue;seen.add(from);const next=[...path,from];queue.push(next);affected.push({environment:from,path:next});}}
 return {root,affected,state:'demonstration',executable:false};
}
export function simulateResourceChange(environment,before,after){
 if(!Object.hasOwn(specialized,environment)||!before||!after||before.id!==after.id||before.kind!==after.kind)throw Error('Invalid resource identity');
 const fields=before.fields?[['name','Resource name'],...before.fields]:[['name','Resource name'],['cpu','Virtual CPUs',1,32],['ram','Memory GB',1,64],['port','Service port',1,65535],['backup','Automated backup']];
 const changes=[];
 for(const [key,,min,max] of fields){const value=after[key];if(key==='name'?typeof value!=='string'||!value.trim()||value.length>120:Number.isFinite(min)?!Number.isInteger(value)||value<min||value>max:typeof value!=='boolean')throw Error('Invalid property: '+key);if(value!==before[key])changes.push({property:key,before:before[key],after:value});}
 return {format:'one-twin-simulation-v1',environment,resourceId:before.id,changes,potentialOutageImpact:changes.length&&before.id===specialized[environment].id?modeledImpact(environment).affected:[],state:'demonstration',executable:false,requiresReview:true};
}
export function recommendResourceChange(environment,before,after){
 const simulation=simulateResourceChange(environment,before,after);
 const findings=[];
 for(const c of simulation.changes){
 if(typeof c.before==='boolean'&&c.before&&!c.after) findings.push({code:'BOOLEAN_DISABLED',property:c.property,reason:'Review consequences of disabling an existing setting.'});
 if(c.property==='port')findings.push({code:'CONNECTIVITY_CHANGE',property:c.property,reason:'Validate clients, routing and access policy.'});
 if(typeof c.before==='number'&&typeof c.after==='number'&&c.after<c.before)findings.push({code:'NUMERIC_REDUCTION',property:c.property,reason:'Review the meaning and operational consequences of this reduction.'});
 }
 if(simulation.potentialOutageImpact.length)findings.push({code:'DEPENDENCY_REVIEW',reason:'Review modeled outage dependencies before scheduling changes.'});
 return {format:'one-recommendation-v1',method:'deterministic-rules',state:'demonstration',simulation,findings,recommendation:!simulation.changes.length?'no-change':findings.length?'review-required':'validate-before-review',alternatives:['retain-current-state','validate-proposal-in-isolated-environment'],executable:false,authorized:false};
}
export function buildReviewManifest(environment,before,after){
 const recommendation=recommendResourceChange(environment,before,after);
 if(!recommendation.simulation.changes.length)throw Error('No proposed changes');
 return {format:'one-resource-review-v1',environment,resourceId:before.id,source:'synthetic-fixture',state:'demonstration',changes:recommendation.simulation.changes,findings:recommendation.findings,potentialOutageImpact:recommendation.simulation.potentialOutageImpact,reviewState:'local-draft',requiresIndependentApproval:true,authorized:false,executable:false};
}
export function createInspector(host,{isReadOnly,onPlan}){
 const el=(tag,text='')=>{const n=document.createElement(tag);n.textContent=text;return n;};
 let environmentId='command';let selected=0,tab='Properties',items=fixtures,draft={...fixtures[0]};
 function render(){
 const readOnly=isReadOnly(),original=items[selected];host.replaceChildren(el('h2','Object Inspector'),el('p','Synthetic resources — no provider connection'));
 const picker=el('select');picker.setAttribute('aria-label','Inspect resource');items.forEach((r,i)=>{const o=el('option',r.name);o.value=String(i);picker.append(o);});picker.value=String(selected);picker.onchange=()=>{selected=Number(picker.value);draft={...items[selected]};render();};
 const menu=el('select');menu.setAttribute('aria-label','Inspector section');for(const t of tabs)menu.append(el('option',t));menu.value=tab;menu.onchange=()=>{tab=menu.value;render();};host.append(picker,menu);
 const output=el('p');output.setAttribute('role','status');
 if(tab==='Properties'||tab==='Configuration'){
 const fields=original.fields?[['name','Resource name'],...original.fields]:[['name','Resource name'],['cpu','Virtual CPUs',1,32],['ram','Memory GB',1,64],['port','Service port',1,65535],['backup','Automated backup']];for(const [key,label,min,max] of fields){
 const l=el('label',label+' '),input=el('input');input.type=typeof draft[key]==='boolean'?'checkbox':Number.isFinite(min)?'number':'text';if(Number.isFinite(min)){input.min=String(min);input.max=String(max);input.step='1';}if(input.type==='checkbox')input.checked=draft[key];else input.value=String(draft[key]);input.disabled=readOnly;input.oninput=()=>{draft[key]=input.type==='checkbox'?input.checked:Number.isFinite(min)?input.valueAsNumber:input.value;};l.append(input);host.append(l);
 }
 if(!readOnly){const save=el('button','Save change plan');save.type='button';save.onclick=()=>{if(!draft.name.trim()||draft.name.length>120||!fields.filter(([, ,min])=>Number.isFinite(min)).every(([key,,a,b])=>Number.isInteger(draft[key])&&draft[key]>=a&&draft[key]<=b)){output.textContent='Invalid properties.';return;}if(JSON.stringify(draft)===JSON.stringify(original)){output.textContent='No changes.';return;}const simulation=simulateResourceChange(environmentId,original,draft);onPlan({before:{...original},after:{...draft},simulation,manifest:buildReviewManifest(environmentId,original,draft),executable:false});draft={...original};render();};const reset=el('button','Revert properties');reset.type='button';reset.onclick=()=>{draft={...original};render();};const preview=el('button','Simulate change');preview.type='button';preview.onclick=()=>{try{output.textContent=JSON.stringify(simulateResourceChange(environmentId,original,draft),null,2);}catch{output.textContent='Invalid proposed configuration.';}};const recommend=el('button','Evaluate recommendation');recommend.type='button';recommend.onclick=()=>{try{output.textContent=JSON.stringify(recommendResourceChange(environmentId,original,draft),null,2);}catch{output.textContent='Invalid proposed configuration.';}};const review=el('button','Preview review manifest');review.type='button';review.onclick=()=>{try{output.textContent=JSON.stringify(buildReviewManifest(environmentId,original,draft),null,2);}catch{output.textContent='A valid changed configuration is required.';}};host.append(save,reset,preview,recommend,review);}
 }else if(tab==='Details'){host.append(el('pre',JSON.stringify(original,null,2)));}
 else if(tab==='Tools'){const inspect=el('button',operations[environmentId]?.[0]??'Inspect configuration');inspect.type='button';inspect.onclick=()=>{output.textContent=JSON.stringify(original);};host.append(inspect);}
 else if(tab==='Actions'){host.append(el('p','Planning only — no execution or provider connection.'));const operation=operations[environmentId]?.[1];if(operation&&!readOnly){const propose=el('button',operation);propose.type='button';propose.onclick=()=>{onPlan({environment:environmentId,operation,resourceId:original.id,before:{...original},after:{...original},executable:false,requiresReview:true});output.textContent='Non-executable proposal recorded.';};host.append(propose);}else host.append(el('p','Read-only surface.')); }
 else if(tab==='Relationships'){
 host.append(el('p','Illustrative dependency model — not discovered infrastructure.'));
 if(original.id!==specialized[environmentId]?.id){host.append(el('p','No modeled relationships for this fixture.'));}
 else for(const [from,to,type] of relationships.filter(([a,b])=>a===environmentId||b===environmentId)){const row=el('p',specialized[from].name+' — '+type+' → '+specialized[to].name);host.append(row);}
 }
 else if(tab==='Intelligence'){
 host.append(el('p','Modeled outage impact — synthetic dependencies only. Governance, monitoring and financial edges do not propagate outages.'));
 if(original.id===specialized[environmentId]?.id){const result=modeledImpact(environmentId);host.append(el('h3',result.affected.length+' modeled downstream environments'));for(const item of result.affected)host.append(el('p',item.path.map(id=>specialized[id].name).join(' → ')));if(!result.affected.length)host.append(el('p','No downstream impact in this limited model. This does not establish operational safety.'));}
 else host.append(el('p','No modeled dependency evidence for this fixture.'));
 }
 else if(tab==='Security'){host.append(el('p','Authentication unavailable. Execution disabled. Independent approval required.'));}
 else host.append(el('p',tab+' — authoritative integration unavailable.'));
 host.append(output);
 }
 const initial=specialized[environmentId];if(initial){items=[{...initial,...Object.fromEntries(initial.fields.map(([key,,,,value])=>[key,value]))},...fixtures];draft={...items[0]};}render();return {setEnvironment(id){environmentId=id;const spec=specialized[id];items=spec?[{...spec,...Object.fromEntries(spec.fields.map(([key,,,,value])=>[key,value]))},...fixtures]:fixtures;selected=0;draft={...items[0]};render();},refresh(){if(isReadOnly())draft={...items[selected]};render();}};
}
