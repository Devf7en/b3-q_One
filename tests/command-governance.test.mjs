import test from 'node:test';import assert from 'node:assert/strict';import {planCommand,listOperations} from '../packages/command-governance/index.mjs';
const base={workspaceId:'W09',target:'demo',operation:'repository.inspect',parameters:{repository:'example'}};
test('read plans require authorization and cannot execute',()=>{const p=planCommand(base);assert.equal(p.executable,false);assert.equal(p.authorizationRequired,true);assert.equal(p.approvalRequired,false);});
test('changes require approval',()=>{const p=planCommand({...base,workspaceId:'W11',operation:'service.restart',parameters:{resource:'demo'}});assert.equal(p.approvalRequired,true);});
test('unknown operations, targets and parameters rejected',()=>{for(const patch of [{operation:'shell'},{operation:'constructor'},{target:''},{parameters:{repository:'x',shell:'x'}},{workspaceId:'W08'}])assert.throws(()=>planCommand({...base,...patch}));});
test('all operations remain non executable',()=>{for(const o of listOperations())assert.equal(planCommand({...base,operation:o.id,parameters:Object.fromEntries(o.args.map(k=>[k,'demo']))}).executable,false);});
