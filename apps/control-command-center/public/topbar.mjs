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
 const compact=width<900,medium=width<1350;
 for(let i=0;i<ordered.length;i++){
 const move=medium&&(i>=5||compact&&i!==3);
 if(move)content.append(ordered[i]);else bar.insertBefore(ordered[i],overflow);
 }
 if(compact){bar.insertBefore(overflow,account);}else{bar.insertBefore(overflow,account);}
 bar.append(account);
 overflow.hidden=!medium;
 if(!medium)overflow.open=false;
}
// Position the open menu against the actual visible viewport, not the header button.
function positionMenu(){
 if(!overflow.open||window.innerWidth>=900)return;
 const viewport=window.visualViewport;
 const left=(viewport?.offsetLeft||0)+12;
 const width=Math.max(180,(viewport?.width||window.innerWidth)-24);
 const top=Math.max(0,document.querySelector('header').getBoundingClientRect().bottom+6);
 const styles={position:'fixed',left:left+'px',right:'auto',width:width+'px',maxWidth:width+'px',boxSizing:'border-box',top:top+'px'};
 for(const [key,value] of Object.entries(styles))content.style.setProperty(key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),value,'important');
}
overflow.addEventListener('toggle',positionMenu);
window.addEventListener('resize',positionMenu);
window.visualViewport?.addEventListener('resize',positionMenu);
window.visualViewport?.addEventListener('scroll',positionMenu);
const media=window.matchMedia('(max-width:1349px)');
const narrow=window.matchMedia('(max-width:899px)');
media.addEventListener('change',arrange);narrow.addEventListener('change',arrange);
document.addEventListener('pointerdown',event=>{if(overflow.open&&!overflow.contains(event.target))overflow.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overflow.open){overflow.open=false;overflow.querySelector('summary').focus();}});
arrange();
