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
 const visibleLeft=viewport?.offsetLeft||0;
 const visibleWidth=viewport?.width||window.innerWidth;
 const accountPanel=document.getElementById('account-menu');
 const accountWidth=accountPanel?parseFloat(getComputedStyle(accountPanel).width)||240:240;
 const gutter=8;
 const width=Math.min(accountWidth,Math.max(0,visibleWidth-gutter*2));
 const left=visibleLeft+visibleWidth-width-gutter;
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

// Mobile navigation is a single active layer: a submenu replaces More rather
// than opening underneath it. The existing app owns the submenu content.
const submenuTargets=new Map([
 ['dock-toggle','dock-menu'],
 ['notifications','global-info'],
 ['preferences','global-info']
]);
let mobileSubmenu=null;
function closeSubmenu(){
 if(!mobileSubmenu)return;
 const {trigger,panel}=mobileSubmenu;
 panel.hidden=true;
 trigger.setAttribute('aria-expanded','false');
 mobileSubmenu=null;
}
function returnToMore(){
 closeSubmenu();
 overflow.open=true;
 positionMenu();
 overflow.querySelector('summary').focus();
}
content.addEventListener('click',event=>{
 if(window.innerWidth>=900)return;
 const trigger=event.target.closest('button');
 if(!trigger||!submenuTargets.has(trigger.id))return;
 const panel=document.getElementById(submenuTargets.get(trigger.id));
 if(!panel)return;
 // Close the parent before the existing click handler opens the destination.
 overflow.open=false;
 if(mobileSubmenu&&mobileSubmenu.panel!==panel)closeSubmenu();
 queueMicrotask(()=>{
  if(panel.hidden){mobileSubmenu=null;return;}
  mobileSubmenu={trigger,panel};
  panel.querySelector('[data-mobile-menu-back]')?.remove();
  const back=document.createElement('button');
  back.type='button';
  back.dataset.mobileMenuBack='';
  back.textContent='‹ Back to More';
  back.setAttribute('aria-label','Back to More menu');
  back.addEventListener('click',returnToMore);
  panel.prepend(back);
  back.focus();
 });
});
document.addEventListener('pointerdown',event=>{
 if(window.innerWidth>=900||!mobileSubmenu)return;
 if(mobileSubmenu.panel.contains(event.target)||mobileSubmenu.trigger.contains(event.target))return;
 closeSubmenu();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&mobileSubmenu){
  // App-level Escape listeners may also close the panel; return remains available
  // through the explicit Back button for predictable navigation.
  closeSubmenu();
 }
});

arrange();
