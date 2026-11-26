import {createOidcVerifier} from '../oidc-verifier/index.mjs';
import {createIdentityBoundary} from '../identity/index.mjs';
import {createMembershipLookup} from '../identity-data/index.mjs';
import {createDataRuntime} from '../data-runtime/index.mjs';
import {createGovernanceService} from '../transactional-governance/index.mjs';
import {createGateway} from '../api-gateway/index.mjs';
import {createApiServer} from '../api-http/index.mjs';
export function createOperationalRuntime({identityPool,servicePool,oidc,maxBodyBytes}={}){
 if(!identityPool||!servicePool||identityPool===servicePool)throw Error('Separate trusted pools required');
 const verifyToken=createOidcVerifier(oidc);
 const authenticate=createIdentityBoundary({verifyToken,findMembership:createMembershipLookup({pool:identityPool}),issuer:oidc.issuer,audience:oidc.audience});
 const transaction=createDataRuntime({pool:servicePool,authenticate});
 const governance=createGovernanceService({transaction});
 return createApiServer({gateway:createGateway({authenticate,transaction,governance}),maxBodyBytes});
}
