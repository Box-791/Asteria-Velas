'use strict';
const $=s=>document.querySelector(s),repo='Box-791/Asteria-Velas';
let token='',branch='',head='',catalog=null,selected=null,dirty=false,busy=false;
const pending=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(s,error=false){$('#status').textContent=s;$('#status').className=error?'error':'success'}
async function api(path,method='GET',body){
 const url=`https://api.github.com/repos/${repo}${path?`/${path}`:''}`;
 let r;
 try{
  r=await fetch(url,{method,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 }catch{
  throw Error('No se pudo conectar con GitHub. Revisa tu conexión a Internet y vuelve a intentar. Si continúa, prueba abrir esta página en otro navegador.');
 }
 if(!r.ok){
  let message='';try{message=(await r.json()).message}catch{}
  if(r.status===401)throw Error('GitHub no aceptó el token. Comprueba que esté completo y no haya caducado.');
  if(r.status===403)throw Error(`GitHub rechazó el acceso (403). Revisa los permisos del token o el límite de solicitudes. ${message}`);
  if(r.status===404)throw Error('GitHub no encontró el recurso (404). Comprueba que el token tenga acceso a Box-791/Asteria-Velas.');
  throw Error(`GitHub (${r.status}): ${message||'No se pudo completar la operación.'}`);
 }
 return r.status===204?null:r.json();
}
function encode(s){const bytes=new TextEncoder().encode(s);let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary)}
function decode(s){return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')),c=>c.charCodeAt(0)))}
$('#login').onsubmit=async e=>{e.preventDefault();token=$('#token').value.trim();$('#token').value='';e.submitter.disabled=true;try{status('Conectando…');const info=await api('');if(!info.permissions?.push)throw Error('Esta cuenta no tiene permiso para editar el repositorio.');branch=info.default_branch;head=(await api(`git/ref/heads/${encodeURIComponent(branch)}`)).object.sha;const file=await api(`contents/public/data/catalog.json?ref=${head}`);catalog=JSON.parse(decode(file.content));$('#connect').hidden=true;$('#workspace').hidden=false;status('Conectado. Selecciona una vela o agrega una nueva.');list()}catch(err){token='';status(err.message,true)}finally{e.submitter.disabled=false}};
function list(){const parent=$('#list');parent.replaceChildren();for(const p of catalog.products){const b=document.createElement('button');b.type='button';b.textContent=p.name;b.classList.toggle('selected',p.id===selected);const s=document.createElement('small');s.textContent=`$${p.price} MXN · ${p.available?'Visible':'Oculta'}`;b.append(s);b.onclick=()=>open(p.id);parent.append(b)}}
function unsaved(){return $('#editor').dataset.changed==='true'}
function open(id){if(unsaved()&&!confirm('Hay cambios sin guardar en este formulario. ¿Descartarlos?'))return;selected=id;const p=catalog.products.find(p=>p.id===id);$('#editor').hidden=false;for(const key of ['name','price','wholesale','category','description','size'])$('#editor').elements[key].value=p[key]??'';$('#editor').elements.available.checked=p.available;$('#editor').dataset.changed='false';photos();list()}
function photos(){const p=catalog.products.find(p=>p.id===selected);if(!p)return;$('#photo-list').replaceChildren();p.images.forEach((path,i)=>{const div=document.createElement('div');const img=document.createElement('img');img.alt=`Foto ${i+1}`;img.src=pending.get(path)?.url||path;div.append(img);const cover=document.createElement('button');cover.type='button';cover.textContent=i===0?'✓ Portada':'Portada';cover.onclick=()=>{p.images.splice(i,1);p.images.unshift(path);dirty=true;photos()};const remove=document.createElement('button');remove.type='button';remove.textContent='Quitar';remove.onclick=()=>{p.images.splice(i,1);dirty=true;photos()};div.append(cover,remove);$('#photo-list').append(div)})}
$('#editor').addEventListener('input',()=>{$('#editor').dataset.changed='true';dirty=true});
$('#editor').onsubmit=e=>{e.preventDefault();const f=e.target,p=catalog.products.find(p=>p.id===selected);if(!p.images.length){status('Agrega al menos una foto antes de guardar.',true);return}for(const k of ['name','category','description','size'])p[k]=f.elements[k].value.trim();if(!p.name||!p.category||!p.description){status('Completa los campos obligatorios.',true);return}p.price=Number(f.elements.price.value);p.wholesale=f.elements.wholesale.value===''?null:Number(f.elements.wholesale.value);p.available=f.elements.available.checked;dirty=true;f.dataset.changed='false';list();status('Borrador guardado. Pulsa «Publicar cambios» para actualizar el catálogo público.')};
$('#new').onclick=()=>{if(unsaved()&&!confirm('¿Descartar los cambios del formulario?'))return;$('#editor').dataset.changed='false';const id=crypto.randomUUID();catalog.products.push({id,name:'Nueva vela',price:0,wholesale:null,category:'Figuras',description:'',size:'',images:[],available:true});dirty=true;open(id)};
$('#delete').onclick=()=>{if(!confirm('¿Eliminar esta vela del catálogo? Se aplicará al publicar.'))return;catalog.products=catalog.products.filter(p=>p.id!==selected);selected=null;dirty=true;$('#editor').hidden=true;$('#editor').dataset.changed='false';list();status('Vela eliminada del borrador.')};
async function optimize(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Usa fotos JPEG, PNG o WebP.');if(file.size>20*1024*1024)throw Error('Cada foto debe pesar menos de 20 MB.');const bitmap=await createImageBitmap(file);const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);const ctx=canvas.getContext('2d');ctx.fillStyle='#f8f5ee';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas.toDataURL('image/jpeg',.86)}
$('#photos').onchange=async e=>{const p=catalog.products.find(p=>p.id===selected);busy=true;$('#publish').disabled=true;try{for(const file of e.target.files){status('Optimizando fotos…');const url=await optimize(file),path=`assets/upload-${crypto.randomUUID()}.jpg`;pending.set(path,{url,content:url.split(',')[1]});p.images.push(path);dirty=true}if(p.id===selected)photos();status('Fotos agregadas al borrador. Guarda los datos y publica cuando esté listo.')}catch(err){status(err.message,true)}finally{e.target.value='';busy=false;$('#publish').disabled=false}};
$('#publish').onclick=async()=>{if(busy)return;if(batchItems.length){status('Agrega el lote al catálogo o descártalo antes de publicar.',true);$('#batch').scrollIntoView({behavior:'smooth'});return}if(unsaved()){status('Guarda el formulario antes de publicar.',true);return}if(!dirty){status('No hay cambios por publicar.');return}if(catalog.products.some(p=>!p.name||!p.description||!p.category||!p.images.length||!Number.isFinite(p.price)||p.price<0)){status('Todas las velas deben tener nombre, descripción, categoría, precio válido y al menos una foto.',true);return}busy=true;for(const b of document.querySelectorAll('#workspace button,#workspace input,#workspace textarea'))b.disabled=true;try{status('Publicando… Mantén esta página abierta.');const current=await api(`git/ref/heads/${encodeURIComponent(branch)}`);if(current.object.sha!==head)throw Error('El catálogo cambió en GitHub desde que abriste esta sesión. Copia tus cambios, desconecta y vuelve a conectar para cargar la versión más reciente.');const commit=await api(`git/commits/${head}`);const tree=[];const used=new Set(catalog.products.flatMap(p=>p.images));for(const [path,file] of pending){if(!used.has(path))continue;const blob=await api('git/blobs','POST',{content:file.content,encoding:'base64'});tree.push({path:`public/${path}`,mode:'100644',type:'blob',sha:blob.sha})}const blob=await api('git/blobs','POST',{content:encode(JSON.stringify(catalog,null,2)+'\n'),encoding:'base64'});tree.push({path:'public/data/catalog.json',mode:'100644',type:'blob',sha:blob.sha});const nextTree=await api('git/trees','POST',{base_tree:commit.tree.sha,tree});const nextCommit=await api('git/commits','POST',{message:'Actualizar catálogo de Asteria Velas',tree:nextTree.sha,parents:[head]});await api(`git/refs/heads/${encodeURIComponent(branch)}`,'PATCH',{sha:nextCommit.sha,force:false});head=nextCommit.sha;pending.clear();dirty=false;photos();status('¡Cambios guardados en GitHub! El catálogo se actualizará en unos minutos. Puedes revisar el despliegue en la pestaña Actions del repositorio.')}catch(err){status(err.message,true)}finally{busy=false;for(const b of document.querySelectorAll('#workspace button,#workspace input,#workspace textarea'))b.disabled=false}};
$('#disconnect').onclick=()=>{if((dirty||unsaved()||batchItems.length)&&!confirm('¿Desconectar y descartar los cambios pendientes?'))return;location.reload()};
addEventListener('beforeunload',e=>{if(dirty||busy||batchItems.length){e.preventDefault();e.returnValue=''}});

// Staged batch entries are kept separate until the complete form is valid.
let batchItems=[];
function batchStatus(message,error=false){$('#batch-status').textContent=message;$('#batch-status').className=error?'error':'success'}
function renderBatch(){
 $('#batch-form').hidden=batchItems.length===0;
 $('#batch-items').innerHTML=batchItems.map(({product:p,file})=>`<article class="batch-item" data-batch-id="${p.id}"><img src="${file.url}" alt="Vista previa de la vela"><div><label>Nombre<input data-field="name" value="${esc(p.name)}" required maxlength="100"></label><div class="field-row"><label>Precio (MXN)<input data-field="price" type="number" value="${esc(p.price)}" required min="0" step="0.01"></label><label>Categoría<input data-field="category" value="${esc(p.category)}" required maxlength="60"></label></div><label>Aroma o descripción<textarea data-field="description" rows="2" required maxlength="1000">${esc(p.description)}</textarea></label><label>Medidas (opcional)<input data-field="size" value="${esc(p.size)}" maxlength="100"></label><button class="chip" type="button" data-remove="${p.id}">Quitar del lote</button></div></article>`).join('');
}
$('#batch-files').onchange=async e=>{
 if(busy)return;
 const files=[...e.target.files];
 if(files.length>20){batchStatus('Selecciona hasta 20 fotos a la vez.',true);e.target.value='';return}
 busy=true;
 const controls=[...document.querySelectorAll('#workspace button,#workspace input,#workspace textarea')];
 controls.forEach(el=>el.disabled=true);
 let added=0;const failures=[];
 try{
  for(const [index,file] of files.entries()){
   batchStatus(`Preparando foto ${index+1} de ${files.length}…`);
   try{
    const url=await optimize(file),path=`assets/upload-${crypto.randomUUID()}.jpg`;
    const price=$('#batch-price').value;
    batchItems.push({product:{id:crypto.randomUUID(),name:file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').slice(0,100),price:price===''?'':Number(price),wholesale:null,category:$('#batch-category').value.trim(),description:$('#batch-description').value.trim(),size:'',images:[path],available:true},file:{url,content:url.split(',')[1]}});
    added++;
   }catch(err){failures.push(`${file.name}: ${err.message}`)}
  }
  renderBatch();batchStatus(`${added} ${added===1?'vela preparada':'velas preparadas'}. Revisa los datos de cada vela.${failures.length?' '+failures.join(' '):''}`,failures.length>0);
 }finally{e.target.value='';busy=false;controls.forEach(el=>el.disabled=false)}
};
$('#batch-items').addEventListener('input',e=>{
 const field=e.target.dataset.field;if(!field)return;
 const entry=batchItems.find(item=>item.product.id===e.target.closest('[data-batch-id]').dataset.batchId);
 entry.product[field]=field==='price'?(e.target.value===''?'':Number(e.target.value)):e.target.value;
});
$('#batch-items').addEventListener('click',e=>{
 const button=e.target.closest('[data-remove]');if(!button)return;
 batchItems=batchItems.filter(item=>item.product.id!==button.dataset.remove);renderBatch();batchStatus(`${batchItems.length} velas en el lote.`);
});
$('#batch-apply').onclick=()=>{
 if(!batchItems.length){batchStatus('Selecciona las fotos para preparar un lote.');return}
 const price=$('#batch-price').value,category=$('#batch-category').value.trim(),description=$('#batch-description').value.trim();
 if(price!==''&&!$('#batch-price').checkValidity()){batchStatus('Escribe un precio válido mayor o igual a cero.',true);return}
 for(const {product} of batchItems){if(price!=='')product.price=Number(price);if(category)product.category=category;if(description)product.description=description}
 renderBatch();batchStatus('Datos comunes aplicados. Puedes ajustar cada vela por separado.');
};
$('#batch-clear').onclick=()=>{if(!confirm('¿Descartar todas las velas de este lote?'))return;batchItems=[];renderBatch();batchStatus('Lote descartado.')};
$('#batch-form').onsubmit=e=>{
 e.preventDefault();if(busy)return;
 for(const {product:p} of batchItems){
  for(const key of ['name','category','description','size'])p[key]=p[key].trim();
  if(!p.name||!p.category||!p.description||!Number.isFinite(p.price)||p.price<0){batchStatus('Completa nombre, categoría, descripción y precio válido de todas las velas.',true);return}
 }
 const count=batchItems.length;
 for(const {product,file} of batchItems){catalog.products.push(product);pending.set(product.images[0],file)}
 batchItems=[];dirty=true;renderBatch();list();batchStatus(`${count} velas agregadas al catálogo en borrador.`);
 status('Lote listo. Pulsa «Publicar cambios» para publicar todas las velas juntas.');$('#publish').focus();
};
