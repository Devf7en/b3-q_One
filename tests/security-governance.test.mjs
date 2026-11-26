import test from 'node:test';import assert from 'node:assert/strict';import {evaluateRelease,summarizeFindings} from '../packages/security-governance/index.mjs';
const evidence=['build','tests','dependency-scan','secret-scan','policy'].map(gate=>({gate,status:'pass',source:'fixture',observed_at:'2026-01-01T00:00:00Z'}));
test('complete fixture permits review only',()=>{const r=evaluateRelease(evidence,[]);assert.equal(r.decision,'eligible-for-review');assert.equal(r.executable,false);});
test('missing, duplicate and failed gates block',()=>{for(const e of [[],[...evidence,evidence[0]],evidence.map(x=>({...x,status:'fail'}))])assert.equal(evaluateRelease(e,[]).decision,'blocked');});
test('open high findings and malformed findings block',()=>{for(const f of [{id:'a',severity:'high',status:'open',source:'fixture'},{severity:'unknown'}])assert.equal(evaluateRelease(evidence,[f]).decision,'blocked');});
test('summary counts open findings only',()=>assert.equal(summarizeFindings([{severity:'high',status:'open'},{severity:'high',status:'resolved'}]).high,1));
