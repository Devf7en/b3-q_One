import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const load=name=>JSON.parse(readFileSync(new URL('../packages/contracts/'+name+'.json',import.meta.url),'utf8'));
const environments=load('environments');
const workspaces=load('workspaces');
const factories=load('factories');

function uniqueIds(items,label){
 assert.ok(Array.isArray(items),label+' must be an array');
 const ids=items.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length,label+' identifiers must be unique');
 for(const item of items){
  assert.ok(typeof item.id==='string'&&item.id.trim(),label+' must have an ID');
  assert.ok(typeof item.name==='string'&&item.name.trim()||label==='factories',label+' must have a name');
 }
}

test('canonical environment registry retains all 16 ordered environments',()=>{
 assert.equal(environments.project,'b3eq-one');
 assert.equal(environments.environments.length,16);
 uniqueIds(environments.environments,'environments');
 assert.deepEqual(environments.environments.map(x=>x.ordinal),Array.from({length:16},(_,i)=>i+1));
 for(const item of environments.environments)assert.equal(item.status,'planned');
});

test('canonical workspace registry retains 18 defined workspaces',()=>{
 assert.equal(workspaces.project,'b3eq-one');
 assert.equal(workspaces.workspaces.length,18);
 uniqueIds(workspaces.workspaces,'workspaces');
 for(const [i,item] of workspaces.workspaces.entries()){
  assert.equal(item.id,'W'+String(i+1).padStart(2,'0'));
  assert.ok(Array.isArray(item.panels)&&item.panels.length>0,item.id+' needs panels');
  assert.equal(new Set(item.panels).size,item.panels.length,item.id+' duplicate panel identifiers');
 }
});

test('factory catalog retains 8 distinct demonstration families',()=>{
 assert.equal(factories.factories.length,8);
 uniqueIds(factories.factories,'factories');
 for(const item of factories.factories){
  assert.equal(item.state,'demonstration');
  assert.ok(Array.isArray(item.components),item.id+' components must be an array');
  assert.equal(new Set(item.components).size,item.components.length,item.id+' duplicate components');
 }
});
