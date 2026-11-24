// Server-only transaction boundary; pool must be a trusted PostgreSQL driver pool.
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createDataRuntime({pool,authenticate}){
 if(typeof pool?.connect!=='function'||typeof authenticate!=='function')throw Error('Trusted dependencies required');
 return async function transaction({token,tenantId},work){
 if(typeof tenantId!=='string'||!uuid.test(tenantId)||typeof work!=='function')throw Error('Invalid transaction');
 const principal=await authenticate(token,tenantId);
 if(!principal||principal.tenantId!==tenantId||!uuid.test(principal.userId)||!['viewer','operator','approver'].includes(principal.role))throw Error('Unauthorized');
 const client=await pool.connect();
 let discard=false;
 try{
 await client.query('BEGIN');
 await client.query("SELECT set_config('one.tenant_id', $1, true)",[tenantId]);
 const membership=await client.query('SELECT role FROM one_runtime.memberships WHERE tenant_id=$1 AND user_id=$2 FOR SHARE',[tenantId,principal.userId]);
 if(membership.rows.length!==1||membership.rows[0].role!==principal.role)throw Error('Membership changed');
 const result=await work(client,Object.freeze({...principal}));
 await client.query('COMMIT');
 return result;
 }catch(error){try{await client.query('ROLLBACK');}catch{discard=true;}throw error;}
 finally{client.release(discard);}
 };
}
