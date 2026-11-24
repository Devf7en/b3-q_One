// Edges point from dependency to dependent. Pure analysis; no operational side effects.
export function analyzeImpact(graph,root){
 const nodes=new Map(graph.nodes.map(n=>[n.id,n]));
 if(nodes.size!==graph.nodes.length)throw Error('Duplicate node');
 if(!nodes.has(root))throw Error('Unknown root');
 const adjacency=new Map([...nodes.keys()].map(id=>[id,[]]));
 for(const e of graph.edges){if(!nodes.has(e.from)||!nodes.has(e.to))throw Error('Unknown edge endpoint');adjacency.get(e.from).push(e.to);}
 const paths=new Map([[root,[root]]]),queue=[root];
 for(let i=0;i<queue.length;i++){const id=queue[i];for(const next of adjacency.get(id)){if(paths.has(next))continue;paths.set(next,[...paths.get(id),next]);queue.push(next);}}
 const affected=queue.slice(1).map(id=>({id,type:nodes.get(id).type,owner:nodes.get(id).owner??null,path:paths.get(id)}));
 return {root,affected,count:affected.length,owners:[...new Set(affected.map(n=>n.owner).filter(Boolean))],state:'simulation',source:graph.source??null,observed_at:graph.observed_at??null};
}
