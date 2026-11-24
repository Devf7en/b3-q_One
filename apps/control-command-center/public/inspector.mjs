const tabs=['Properties','Details','Configuration','Tools','Actions','Relationships','Workflows','Intelligence','Security','Observability','History','Documentation'];
const fixtures=[{id:'srv-001',name:'Application Server',kind:'Compute',cpu:4,ram:8,port:443,backup:true},{id:'db-001',name:'PostgreSQL',kind:'Database',cpu:2,ram:8,port:5432,backup:true},{id:'ctr-001',name:'Container Runtime',kind:'Container',cpu:2,ram:4,port:8080,backup:false}];
const specialized={
 domains:{id:'dns-001',name:'example.invalid',kind:'Domain',fields:[['ttl','DNS TTL seconds',60,86400,900],['autoRenew','Automatic renewal',null,null,false]]},
 containers:{id:'ctr-002',name:'Demo container',kind:'Container',fields:[['replicas','Replicas',0,32,2],['port','Service port',1,65535,8080]]},
 data:{id:'db-002',name:'Demo database',kind:'Database',fields:[['connections','Connection limit',1,1000,100],['backup','Automated backup',null,null,true]]},
 automation:{id:'wf-001',name:'Demo workflow',kind:'Workflow',fields:[['timeout','Timeout seconds',1,3600,60],['enabled','Enabled',null,null,false]]},
 intelligence:{id:'agent-001',name:'Demo agent',kind:'AI Agent',fields:[['budget','Budget micro-USD',0,1000000,100],['review','Human review required',null,null,true]]}
};
export function createInspector(host,{isReadOnly,onPlan}){
 const el=(tag,text='')=>{const n=document.createElement(tag);n.textContent=text;return n;};
 let selected=0,tab='Properties',items=fixtures,draft={...fixtures[0]};
 function render(){
 const readOnly=isReadOnly(),original=items[selected];host.replaceChildren(el('h2','Object Inspector'),el('p','Synthetic resources — no provider connection'));
 const picker=el('select');picker.setAttribute('aria-label','Inspect resource');items.forEach((r,i)=>{const o=el('option',r.name);o.value=String(i);picker.append(o);});picker.value=String(selected);picker.onchange=()=>{selected=Number(picker.value);draft={...items[selected]};render();};
 const menu=el('select');menu.setAttribute('aria-label','Inspector section');for(const t of tabs)menu.append(el('option',t));menu.value=tab;menu.onchange=()=>{tab=menu.value;render();};host.append(picker,menu);
 const output=el('p');output.setAttribute('role','status');
 if(tab==='Properties'||tab==='Configuration'){
 const fields=original.fields?[['name','Resource name'],...original.fields]:[['name','Resource name'],['cpu','Virtual CPUs',1,32],['ram','Memory GB',1,64],['port','Service port',1,65535],['backup','Automated backup']];for(const [key,label,min,max] of fields){
 const l=el('label',label+' '),input=el('input');input.type=typeof draft[key]==='boolean'?'checkbox':Number.isFinite(min)?'number':'text';if(Number.isFinite(min)){input.min=String(min);input.max=String(max);input.step='1';}if(key==='backup')input.checked=draft[key];else input.value=String(draft[key]);input.disabled=readOnly;input.oninput=()=>{draft[key]=key==='backup'?input.checked:Number.isFinite(min)?input.valueAsNumber:input.value;};l.append(input);host.append(l);
 }
 if(!readOnly){const save=el('button','Save change plan');save.type='button';save.onclick=()=>{if(!draft.name.trim()||draft.name.length>120||!fields.filter(([, ,min])=>Number.isFinite(min)).every(([key,,a,b])=>Number.isInteger(draft[key])&&draft[key]>=a&&draft[key]<=b)){output.textContent='Invalid properties.';return;}if(JSON.stringify(draft)===JSON.stringify(original)){output.textContent='No changes.';return;}onPlan({before:{...original},after:{...draft},executable:false});draft={...original};render();};const reset=el('button','Revert properties');reset.type='button';reset.onclick=()=>{draft={...original};render();};host.append(save,reset);}
 }else if(tab==='Details'){host.append(el('pre',JSON.stringify(original,null,2)));}
 else if(tab==='Tools'){const inspect=el('button','Inspect configuration');inspect.type='button';inspect.onclick=()=>{output.textContent=JSON.stringify(original);};host.append(inspect);}
 else if(tab==='Security'){host.append(el('p','Authentication unavailable. Execution disabled. Independent approval required.'));}
 else host.append(el('p',tab+' — authoritative integration unavailable.'));
 host.append(output);
 }
 render();return {setEnvironment(id){const spec=specialized[id];items=spec?[{...spec,...Object.fromEntries(spec.fields.map(([key,,,,value])=>[key,value]))},...fixtures]:fixtures;selected=0;draft={...items[0]};render();},refresh(){if(isReadOnly())draft={...items[selected]};render();}};
}
