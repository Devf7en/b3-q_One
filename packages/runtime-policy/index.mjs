// Pure policy evaluator. Caller must supply server-verified identity and membership.
const grants=Object.freeze({viewer:['project.read','plan.read'],operator:['project.read','plan.read','plan.create'],approver:['project.read','plan.read','plan.approve']});
export function authorize({principal,resource,action,surface}={}){
 if(!principal||!resource||!['control','observatory'].includes(surface))return false;
 if(typeof principal.userId!=='string'||!principal.userId.trim()||typeof principal.tenantId!=='string'||!principal.tenantId.trim()||principal.tenantId!==resource.tenantId)return false;
 if(surface==='observatory'&&!['project.read','plan.read'].includes(action))return false;
 if(!Object.hasOwn(grants,principal.role)||!grants[principal.role].includes(action))return false;
 if(action==='plan.approve'&&(!resource.createdBy||resource.createdBy===principal.userId))return false;
 return true;
}
