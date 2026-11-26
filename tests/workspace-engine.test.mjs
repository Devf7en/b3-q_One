import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaces,createSession,switchWorkspace,switchTheme,layoutKey,getPanels} from '../packages/workspace-engine/index.mjs';
const base=createSession({tenantId:'demo',userId:'user',projectId:'project',resourceId:'resource'});
test('all 18 unique workspace concepts remain available',()=>{assert.equal(workspaces.length,18);assert.equal(new Set(workspaces.map(w=>w.id)).size,18);assert.ok(workspaces.every(w=>w.panels.length));});
test('workspace switches preserve operational context',()=>{for(const w of workspaces){const s=switchWorkspace(base,w.id);assert.equal(s.tenantId,base.tenantId);assert.equal(s.userId,base.userId);assert.equal(s.projectId,base.projectId);assert.equal(s.resourceId,base.resourceId);assert.equal(s.theme,base.theme);assert.deepEqual(getPanels(s),w.panels);}});
test('themes are independent and layout keys are scoped',()=>{assert.equal(switchTheme(base,'dark').workspaceId,base.workspaceId);assert.notEqual(layoutKey(base),layoutKey(switchWorkspace(base,'W18')));assert.notEqual(layoutKey(base),layoutKey(createSession({...base,tenantId:'other'})));});
test('unknown workspace or theme rejected',()=>{assert.throws(()=>switchWorkspace(base,'unknown'));assert.throws(()=>switchTheme(base,'unknown'));});
