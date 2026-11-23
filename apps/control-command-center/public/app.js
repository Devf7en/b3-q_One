const $=id=>document.getElementById(id);
const [w,e]=await Promise.all(['/registry/workspaces','/registry/environments'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error('Registry unavailable');return r.json();}));
let workspace=w.workspaces[0],environment=e.environments[0],observatory=false;
function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
for(const item of w.workspaces){const o=node('option',item.id+' — '+item.name);o.value=item.id;$('workspace').append(o);}
for(const item of e.environments){const b=node('button',item.name);b.onclick=()=>{environment=item;render();};$('environments').append(b);}
function render(){$('title').textContent=workspace.name;$('context').textContent='Demo project / '+environment.name;$('surface').textContent=observatory?'Project Observatory':'Control Command Center';$('toggle').textContent=observatory?'Control Command Center':'Project Observatory';$('command').hidden=observatory;$('response').textContent='';$('panels').replaceChildren();$('panels').dataset.workspace=workspace.id;for(const p of workspace.panels){const card=node('article','');card.append(node('h2',p.replaceAll('-',' ')),node('p',observatory?'Evidence unavailable — no live source configured.':'Planned capability — demonstration shell only.'));$('panels').append(card);}}
$('workspace').onchange=()=>{workspace=w.workspaces.find(x=>x.id===$('workspace').value);render();};
$('theme').onchange=()=>document.documentElement.dataset.theme=$('theme').value;
$('toggle').onclick=()=>{observatory=!observatory;render();};
$('command').onsubmit=event=>{event.preventDefault();if(!observatory)$('response').textContent='Intent preview only: '+$('intent').value+' — planning and execution are not connected.';};
render();
