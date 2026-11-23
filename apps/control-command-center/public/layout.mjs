export function normalize(defaults,saved){
 const base=defaults.map(p=>({...p,collapsed:false}));
 if(!saved||!Array.isArray(saved.panels))return {locked:false,panels:base};
 const seen=new Set(),panels=[];
 for(const p of saved.panels){if(!p||seen.has(p.id)||!base.some(x=>x.id===p.id))continue;seen.add(p.id);panels.push({id:p.id,span:p.span===2?2:1,collapsed:p.collapsed===true});}
 for(const p of base)if(!seen.has(p.id))panels.push(p);
 return {locked:saved.locked===true,panels};
}
export function change(layout,id,action){
 if(action==='lock')return {...layout,locked:!layout.locked};
 if(layout.locked)return layout;
 const panels=layout.panels.map(p=>({...p})),i=panels.findIndex(p=>p.id===id);
 if(i<0)return layout;
 if(action==='collapse')panels[i].collapsed=!panels[i].collapsed;
 if(action==='resize')panels[i].span=panels[i].span===2?1:2;
 const j=i+(action==='up'?-1:action==='down'?1:0);
 if(j>=0&&j<panels.length&&j!==i)[panels[i],panels[j]]=[panels[j],panels[i]];
 return {...layout,panels};
}
export function key(workspace,surface){return JSON.stringify(['b3eq-one-demo-layout-v1',workspace,surface]);}
