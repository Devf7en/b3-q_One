import test from 'node:test';import assert from 'node:assert/strict';import {normalize,change,key} from '../apps/control-command-center/public/layout.mjs';
const defaults=[{id:'a',span:1},{id:'b',span:2}];
test('restore preserves all registered panels and rejects duplicates',()=>{const l=normalize(defaults,{panels:[{id:'b',span:9},{id:'b'},{id:'unknown'}]});assert.deepEqual(l.panels.map(p=>p.id),['b','a']);assert.equal(l.panels[0].span,1);});
test('reorder resize collapse and lock',()=>{let l=normalize(defaults);l=change(l,'a','down');assert.equal(l.panels[1].id,'a');l=change(l,'a','resize');assert.equal(l.panels[1].span,2);l=change(l,'a','collapse');assert.equal(l.panels[1].collapsed,true);l=change(l,'','lock');assert.equal(change(l,'a','up'),l);});
test('workspace and surface preferences separate',()=>{assert.notEqual(key('W01','control'),key('W02','control'));assert.notEqual(key('W01','control'),key('W01','observatory'));});
