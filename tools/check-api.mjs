import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Run the actual editor request helper; fake only DOM and HTTP boundaries.
const nodes=new Map();
const requests=[];
let response={ok:true,status:200,json:async()=>({default_branch:'main'})};
let networkError=false;
const context=vm.createContext({
 document:{querySelector(selector){
  if(!nodes.has(selector))nodes.set(selector,{addEventListener(){}});
  return nodes.get(selector);
 }},
 addEventListener(){},
 fetch:async(url,options)=>{
  requests.push({url,options});
  if(networkError)throw new TypeError('Failed to fetch');
  return response;
 }
});
vm.runInContext(await readFile('public/admin.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
await run("api('')");
assert.equal(requests.at(-1).url,'https://api.github.com/repos/Box-791/Asteria-Velas');
await run("api('git/ref/heads/main')");
assert.equal(requests.at(-1).url,'https://api.github.com/repos/Box-791/Asteria-Velas/git/ref/heads/main');
await run("api('git/refs/heads/main','PATCH',{sha:'next',force:false})");
assert.equal(requests.at(-1).options.method,'PATCH');
assert.deepEqual(JSON.parse(requests.at(-1).options.body),{sha:'next',force:false});
response={ok:false,status:401,json:async()=>({message:'Bad credentials'})};
await assert.rejects(run("api('')"),/no aceptó el token/);
networkError=true;
await assert.rejects(run("api('')"),/No se pudo conectar con GitHub/);
console.log('Editor API checks passed: repository URL, nested requests, writes, credential and network errors.');
