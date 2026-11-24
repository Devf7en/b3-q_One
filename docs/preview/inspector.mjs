const tabs=['Properties','Details','Configuration','Tools','Actions','Relationships','Workflows','Intelligence','Security','Observability','History','Documentation'];
const fixtures=[{id:'srv-001',name:'Application Server',kind:'Compute',cpu:4,ram:8,port:443,backup:true},{id:'db-001',name:'PostgreSQL',kind:'Database',cpu:2,ram:8,port:5432,backup:true},{id:'ctr-001',name:'Container Runtime',kind:'Container',cpu:2,ram:4,port:8080,backup:false}];
export function createInspector(host,{isReadOnly,onPlan}){
 const el=(tag,text='')=>{const n=document.createElement(tag);n.textContent=text;return n;};
 let selected=0,tab='Properties',draft={...fixtures[0]};
 function render(){
 const readOnly=isReadOnly(),original=fixtures[selected];host.replaceChildren(el('h2','Object Inspector'),el('p','Synthetic resources — no provider connection'));
 const picker=el('select');picker.setAttribute('aria-label','Inspect resource');fixtures.forEach((r,i)=>{const o=el('option',r.name);o.value=String(i);picker.append(o);});picker.value=String(selected);picker.onchange=()=>{selected=Number(picker.value);draft={...fixtures[selected]};render();};
 const menu=el('select');menu.setAttribute('aria-label','Inspector section');for(const t of tabs)menu.append(el('option',t));menu.value=tab;menu.onchange=()=>{tab=menu.value;render();};host.append(picker,menu);
 const output=el('p');output.setAttribute('role','status');
 if(tab==='Properties'||tab==='Configuration'){
 for(const [key,label,min,max] of [['name','Resource name'],['cpu','Virtual CPUs',1,32],['ram','Memory GB',1,64],['port','Service port',1,65535],['backup','Automated backup']]){
 const l=el('label',label+' '),input=el('input');input.type=key==='backup'?'checkbox':min?'number':'text';if(min){input.min=String(min);input.max=String(max);input.step='1';}if(key==='backup')input.checked=draft[key];else input.value=String(draft[key]);input.disabled=readOnly;input.oninput=()=>{draft[key]=key==='backup'?input.checked:min?input.valueAsNumber:input.value;};l.append(input);host.append(l);
 }
 if(!readOnly){const save=el('button','Save change plan');save.type='button';save.onclick=()=>{if(!draft.name.trim()||draft.name.length>120||![[draft.cpu,1,32],[draft.ram,1,64],[draft.port,1,65535]].every(([v,a,b])=>Number.isInteger(v)&&v>=a&&v<=b)){output.textContent='Invalid properties.';return;}if(JSON.stringify(draft)===JSON.stringify(original)){output.textContent='No changes.';return;}onPlan({before:{...original},after:{...draft},executable:false});draft={...original};render();};const reset=el('button','Revert properties');reset.type='button';reset.onclick=()=>{draft={...original};render();};host.append(save,reset);}
 }else if(tab==='Details'){host.append(el('pre',JSON.stringify(original,null,2)));}
 else if(tab==='Tools'){const inspect=el('button','Inspect configuration');inspect.type='button';inspect.onclick=()=>{output.textContent=JSON.stringify(original);};host.append(inspect);}
 else if(tab==='Security'){host.append(el('p','Authentication unavailable. Execution disabled. Independent approval required.'));}
 else host.append(el('p',tab+' — authoritative integration unavailable.'));
 host.append(output);
 }
 render();return {refresh(){if(isReadOnly())draft={...fixtures[selected]};render();}};
}
