import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const server=await readFile(resolve(root,'apps/control-command-center/server.mjs'),'utf8');
const routes=[...server.matchAll(/\['([^']+)',\['([^']+)','([^']+)'\]\]/g)];
if(routes.length<20)throw Error('Incomplete route manifest');
for(const [,url,source,type] of routes){
 const dest=url==='/'?'index.html':url.slice(1)+(type==='application/json'?'.json':'');
 let content=await readFile(resolve(root,'apps/control-command-center',source),'utf8');
 if(url==='/')content=content.replaceAll('="/','="./');
 if(url==='/app.js')content=content.replace(/(['"])\/registry\/([a-z-]+)\1/g,(_,q,n)=>q+'./registry/'+n+'.json'+q).replace(/from '\/([^']+)'/g,"from './$1'");
 if(type==='text/javascript'&&!dest.includes('/'))content=content.replace(/from ['"]\.\.\/([^'"]+)['"]/g,(_,n)=>"from './"+n+"'");
 const target=resolve(root,'docs/preview',dest);await mkdir(dirname(target),{recursive:true});await writeFile(target,content);
}
console.log('Generated '+routes.length+' public demonstration assets');
