# Asteria Velas

Catálogo en español para GitHub Pages. Incluye las 11 velas y paquetes de la colección navideña 2026, con fotografías, precios y condiciones de pedido extraídos del PDF original. Los pedidos se realizan por Instagram: [@asteriavelascln](https://www.instagram.com/asteriavelascln/).

## Publicar

1. En el repositorio, abrir **Settings → Pages**.
2. En **Build and deployment → Source**, seleccionar **GitHub Actions**.
3. El workflow **Publicar catálogo** se ejecuta al subir cambios a `main`. También puede iniciarse desde **Actions → Publicar catálogo → Run workflow**.
4. El catálogo quedará en `https://box-791.github.io/Asteria-Velas/`. Esperar a que el workflow termine en verde antes de compartirlo.

Solo se publica `public/`; el PDF original no se sube al repositorio.

## Actualizar productos sin editar código

Abrir `https://box-791.github.io/Asteria-Velas/admin.html`.

### Conexión inicial

La administradora necesita una cuenta de GitHub con permiso de escritura en este repositorio. Si es otra persona, invitarla desde **Settings → Collaborators**.

1. En GitHub, abrir **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Elegir el propietario del repositorio como **Resource owner**, seleccionar **Only select repositories** y marcar **Asteria-Velas**.
3. En **Repository permissions**, permitir **Contents: Read and write**. Elegir una fecha de caducidad y generar el token.
4. Copiar el token en el campo de conexión del administrador. No enviarlo por mensajes, no guardarlo en archivos del proyecto ni compartirlo con clientes. El editor lo guarda solo en memoria; al recargar o cerrar la pestaña deberá conectarse de nuevo. Si caduca, generar otro.

### Subir varias velas a la vez

En el administrador, abrir **Subir varias velas**. Configurar precio, categoría y descripción comunes si se desean. Seleccionar una foto por vela (hasta 20 por selección); el nombre inicial se obtiene del archivo y se puede cambiar. Revisar o completar los datos de cada vela, quitar las que no correspondan y pulsar **Agregar lote al catálogo**. Después, pulsar **Publicar cambios**: todas las velas y fotos se guardan en un solo commit. Para agregar varias fotografías del mismo producto, usar el editor individual. Los lotes pendientes también se pierden al cerrar la pestaña; agregarlos y publicarlos antes de salir.

### Editar y publicar

1. Seleccionar una vela o pulsar **Agregar vela**.
2. Completar nombre, precio en MXN, categoría, aroma/descripción y medidas. El precio de mayoreo es opcional.
3. Agregar una o varias fotos JPEG, PNG o WebP (máximo 20 MB por foto). Se reducen a un máximo de 1600 píxeles y se convierten a JPEG. Elegir **Portada** para cambiar la foto principal; **Quitar** la retira del producto.
4. Usar **Visible en el catálogo** para mostrar u ocultar un producto. **Eliminar vela** lo elimina del borrador.
5. Pulsar **Guardar en borrador** y después **Publicar cambios**. Los borradores viven en la pestaña actual: publicar antes de cerrarla.
6. Esperar unos minutos a que GitHub Actions actualice el catálogo. El historial y estado están en la pestaña **Actions** del repositorio.

La publicación crea un solo commit con los productos y las fotos nuevas. Evita sobrescribir cambios de otra sesión: si el repositorio cambió, el editor pedirá reconectar. Las fotos retiradas dejan de mostrarse pero permanecen en el historial del repositorio. La ruta `/admin.html` es pública, pero leerla no da permisos de escritura: GitHub valida el token para cada operación.

## Desarrollo

No requiere compilación ni dependencias de producción. Node.js 20+ y Python 3 para los siguientes comandos:

```sh
npm run check
npm run dev
```

Abrir `http://localhost:4173`. El contenido está en `public/data/catalog.json`; las imágenes en `public/assets/`. Todos los enlaces son relativos para funcionar bajo la ruta del repositorio en GitHub Pages. La tipografía usa Google Fonts con fuentes locales de respaldo.

Los precios y las condiciones provienen del catálogo proporcionado y deben confirmarse por la propietaria antes de promocionarlo. No se agregaron reseñas, datos de contacto ni condiciones comerciales inventadas.
