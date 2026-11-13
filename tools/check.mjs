import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
const catalog=JSON.parse(await readFile('public/data/catalog.json','utf8'));
assert(Array.isArray(catalog.products));
const ids=new Set();
for(const p of catalog.products){
 assert(p.id&&!ids.has(p.id),'Product IDs must be unique');ids.add(p.id);
 for(const key of ['name','category','description'])assert(typeof p[key]==='string'&&p[key].trim(),`${p.id}: missing ${key}`);
 assert(Number.isFinite(p.price)&&p.price>=0,`${p.id}: invalid price`);
 assert(p.wholesale===null||(Number.isFinite(p.wholesale)&&p.wholesale>=0));
 assert(typeof p.available==='boolean');assert(p.images.length>0);
 for(const image of p.images){assert(/^assets\/[\w./-]+$/.test(image)&&!image.includes('..'));await access(`public/${image}`)}
}
for(const file of ['index.html','admin.html','styles.css','app.js','admin.js','admin.css'])await access(`public/${file}`);
console.log(`Catalog valid: ${ids.size} products; all image assets exist.`);
