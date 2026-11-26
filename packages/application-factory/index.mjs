export function composeFactory(catalog,{factoryId,projectId,components=[]}={}){
 if(!Array.isArray(catalog)||typeof projectId!=='string'||!projectId.trim())throw Error('Explicit project required');
 const matches=catalog.filter(f=>f.id===factoryId);if(matches.length!==1)throw Error('Unknown or ambiguous factory');
 const factory=matches[0];if(!Array.isArray(components)||components.some(c=>typeof c!=='string'||! /^[a-z][a-z0-9-]{0,63}$/.test(c)))throw Error('Invalid components');
 if(factoryId!=='custom'&&components.length)throw Error('Custom components require custom factory');
 const selected=[...new Set(factoryId==='custom'?components:factory.components)];if(!selected.length)throw Error('Components required');
 return {projectId,factoryId,templateVersion:factory.version,components:selected.map(id=>({id,state:'planned'})),requiredReviews:['dependencies','cost','security','capacity','recovery','authorization','approval'],state:'demonstration',executable:false};
}
