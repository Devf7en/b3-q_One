import {analyzeImpact} from '/impact.mjs';
import {normalize,change,key} from '/layout.mjs';
import {visual} from '/visuals.js';
const $=id=>document.getElementById(id);
const [w,e,l]=await Promise.all(['/registry/workspaces','/registry/environments','/registry/layouts'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error('Registry unavailable');return r.json();}));
const graphResponse=await fetch('/registry/demo-graph');if(!graphResponse.ok)throw Error('Demo graph unavailable');const graph=await graphResponse.json();let root=graph.nodes[0].id;
function impactPanel(){const section=node('section','');section.append(node('p','Synthetic dependency simulation — no live evidence'));const select=node('select','');select.setAttribute('aria-label','Simulated failed resource');for(const n of graph.nodes){const o=node('option',n.id);o.value=n.id;select.append(o);}select.value=root;select.onchange=()=>{root=select.value;render();};section.append(select);const result=analyzeImpact(graph,root);section.append(node('h3',result.count+' potentially affected dependencies'));for(const item of result.affected)section.append(node('p',item.path.join(' → ')+' | Owner: '+(item.owner??'Unknown')));return section;}
let workspace=w.workspaces[0],environment=e.environments[0],observatory=false;
function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
for(const item of w.workspaces){const o=node('option',item.id+' — '+item.name);o.value=item.id;$('workspace').append(o);}
for(const item of e.environments){const b=node('button',item.name);b.onclick=()=>{environment=item;render();};$('environments').append(b);}
const toolbar=node('div','');toolbar.className='layout-toolbar';$('panels').before(toolbar);
function button(label,fn,disabled=false){const b=node('button',label);b.type='button';b.onclick=fn;b.disabled=disabled;return b;}
function storageKey(){return key(workspace.id,observatory?'observatory':'control');}
function load(preset){try{return normalize(preset.panels,JSON.parse(localStorage.getItem(storageKey())));}catch{return normalize(preset.panels);}}
function save(layout){try{localStorage.setItem(storageKey(),JSON.stringify(layout));render();}catch{$('response').textContent='Browser layout storage unavailable.';}}
function render(){$('title').textContent=workspace.name;$('context').textContent='Demo project / '+environment.name;$('surface').textContent=observatory?'Project Observatory':'Control Command Center';$('toggle').textContent=observatory?'Control Command Center':'Project Observatory';$('command').hidden=observatory;$('response').textContent='';$('panels').replaceChildren();$('panels').dataset.workspace=workspace.id;const preset=l.presets.find(x=>x.workspaceId===workspace.id);$('panels').dataset.profile=preset.visualProfile;$('panels').dataset.density=preset.density;const layout=load(preset);toolbar.replaceChildren(button(layout.locked?'Unlock layout':'Lock layout',()=>save(change(layout,'','lock'))),button('Restore factory layout',()=>save(normalize(preset.panels)),layout.locked));for(const {id:p,span,collapsed} of layout.panels){const card=node('article','');card.append(node('h2',p.replaceAll('-',' ')),node('p',observatory?'Evidence unavailable — no live source configured.':'Planned capability — demonstration shell only.'));card.dataset.span=span;const controls=node('div','');controls.className='panel-controls';for(const [label,action] of [['Earlier','up'],['Later','down'],['Resize','resize'],[collapsed?'Expand':'Collapse','collapse']])controls.append(button(label,()=>save(change(layout,p,action)),layout.locked));card.insertBefore(controls,card.children[1]);card.children[2].hidden=collapsed;const v=visual(p);if(!observatory&&!collapsed&&workspace.id==='W08'&&p==='blast-radius')card.append(impactPanel());else if(v&&!observatory&&!collapsed)card.append(v);$('panels').append(card);}}
$('workspace').onchange=()=>{workspace=w.workspaces.find(x=>x.id===$('workspace').value);render();};
$('theme').onchange=()=>document.documentElement.dataset.theme=$('theme').value;
$('toggle').onclick=()=>{observatory=!observatory;render();};
$('command').onsubmit=event=>{event.preventDefault();if(!observatory)$('response').textContent='Intent preview only: '+$('intent').value+' — planning and execution are not connected.';};
render();
