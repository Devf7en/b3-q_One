const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs={}){const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;}
export function visual(panel){
 const graph=['topology','graph','intent-graph','digital-twin','dependencies','agents','workflow-editor','threats'].includes(panel);
 const chart=['telemetry','cost','budgets','forecast','allocation','token-metering','model-routing'].includes(panel);
 const terminal=['terminal','ssh','command-runner','code-understanding','api-explorer'].includes(panel);
 if(terminal){const p=document.createElement('pre');p.textContent='DEMONSTRATION SESSION\nNo remote connection\nNo commands executed';return p;}
 if(!graph&&!chart)return null;
 const root=svg('svg',{viewBox:'0 0 320 150',role:'img','aria-label':'Illustrative '+panel+' visualization; no live data'});
 if(graph){const points=[[160,25],[60,100],[160,100],[260,100]];for(const [x,y] of points.slice(1))root.append(svg('line',{x1:160,y1:25,x2:x,y2:y,stroke:'#6486a8','stroke-width':2}));points.forEach(([x,y],i)=>{root.append(svg('rect',{x:x-35,y:y-13,width:70,height:26,rx:5,fill:'#234564',stroke:'#75a7d1'}));const t=svg('text',{x,y:y+4,'text-anchor':'middle',fill:'#fff','font-size':10});t.textContent=['Gateway','Service A','Service B','Data'][i];root.append(t);});}
 else{[34,60,45,82,66,100,78,112].forEach((h,i)=>root.append(svg('rect',{x:15+i*38,y:135-h,width:24,height:h,rx:3,fill:'#4389db'})));}
 return root;
}
