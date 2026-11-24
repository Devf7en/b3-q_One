// Responsive single-row header: move the original controls, never clone them.
const bar=document.getElementById('topbar-actions');
const overflow=document.getElementById('topbar-overflow');
const content=document.getElementById('topbar-overflow-content');
const account=document.getElementById('account-toggle');
const groups=[
 ['surface','workspace','theme','toggle','environment'],
 ['dock-toggle','notifications','preferences']
];
const controls=groups.flat().map(id=>id==='workspace'||id==='theme'||id==='environment'?document.getElementById(id)?.closest('label'):document.getElementById(id));
const ordered=controls.filter(Boolean);
function arrange(){
 const width=window.innerWidth;
 const compact=width<1100,medium=width<1500;
 for(let i=0;i<ordered.length;i++){
 const move=medium&&(i>=5||compact&&i!==3);
 if(move)content.append(ordered[i]);else bar.insertBefore(ordered[i],overflow);
 }
 if(compact){bar.insertBefore(overflow,account);}else{bar.insertBefore(overflow,account);}
 bar.append(account);
 overflow.hidden=!medium;
 if(!medium)overflow.open=false;
}
const media=window.matchMedia('(max-width:1499px)');
const narrow=window.matchMedia('(max-width:1099px)');
media.addEventListener('change',arrange);narrow.addEventListener('change',arrange);
document.addEventListener('pointerdown',event=>{if(overflow.open&&!overflow.contains(event.target))overflow.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overflow.open){overflow.open=false;overflow.querySelector('summary').focus();}});
arrange();
