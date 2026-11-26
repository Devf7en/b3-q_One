const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function createMembershipLookup({pool}){
 if(typeof pool?.query!=='function')throw Error('Trusted identity pool required');
 return async ({issuer,subject,tenantId})=>{
 if(typeof issuer!=='string'||!issuer||typeof subject!=='string'||!subject||!uuid.test(tenantId??''))return null;
 const {rows}=await pool.query('SELECT user_id,tenant_id,role FROM one_runtime.resolve_membership($1,$2,$3)',[issuer,subject,tenantId]);
 if(rows.length!==1)return null;
 const row=rows[0];
 return {userId:row.user_id,tenantId:row.tenant_id,role:row.role};
 };
}
