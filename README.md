# GOOD — tienda online

Tienda de ropa responsive con frontend React/Vite, API Express, MongoDB/Mongoose, sesiones firmadas en cookie segura y almacenamiento de fotos en Cloudinary.

## Antes de iniciar

1. Instalá Node.js 22 o posterior.
2. Creá una base MongoDB (por ejemplo en Atlas), un usuario de base de datos y autorizá tu IP en Network Access.
3. Editá el archivo `.env` de esta carpeta. Reemplazá `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Poné una contraseña administrativa de al menos 14 caracteres. No compartas el `.env` ni lo subas a Git.
4. Completá `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en `.env`. Las fotos originales se guardan en Cloudinary cuando esas tres credenciales están configuradas; el secreto se usa solo en el servidor.
5. En la URI de MongoDB, reemplazá también el nombre del cluster y la base; codificá caracteres especiales de la contraseña (por ejemplo `@` como `%40`).

## Ejecutar en Windows PowerShell

Desde esta carpeta:

```powershell
npm install
npm run seed:admin
npm run dev
```

Abrí `http://localhost:5173`. El panel está en `http://localhost:5173/admin`. El comando `seed:admin` crea la cuenta que pusiste en `.env`; las cuentas que se registran desde la tienda siempre quedan como clientes.

En el panel, cargá la foto frontal y, si la tenés, también la trasera. Las fotos se guardan originales en Cloudinary, sin recortes ni cambios automáticos. Para que el producto se vea bien en la tienda, recomendamos fotos verticales, con buena luz y fondo limpio. Si ya tenés una foto PNG transparente, también se conserva tal cual.

## Qué incluye

- Registro e inicio de sesión para clientes; la contraseña se almacena con hash y la sesión usa cookie `HttpOnly`.
- Acceso administrador preparado con cuenta inicial por `.env` y rol protegido en el servidor.
- Alta, edición y baja de productos con precios, precio anterior, categoría, stock, talles, colores, etiquetas, descripción, publicación y producto destacado.
- Alta y baja de categorías.
- Carga de una foto original de frente y otra del dorso, almacenadas en Cloudinary sin procesamiento automático.
- Vista de producto con selector frente/dorso cuando existen las dos fotos; las tarjetas usan `object-fit: contain` para mostrar la prenda completa.
- Carrito de cliente en el navegador.

## Producción

Configurá `NODE_ENV=production`, la URL pública en `CLIENT_ORIGIN`, una `JWT_SECRET` nueva, una URI real de MongoDB y las tres credenciales de Cloudinary. Luego ejecutá `npm run build` y `npm start`.

Cloudinary conserva las fotos fuera del filesystem efímero del servidor; MongoDB guarda las URLs seguras y los identificadores de los assets. En desarrollo, si las credenciales Cloudinary están vacías, las imágenes se guardan localmente en `server/uploads`.

## Vercel + Render

- En Vercel, conectá este repositorio y elegí `client` como Root Directory. El archivo `client/vercel.json` reenvía `/api/*` y `/uploads/*` al servicio de Render.
- En Render, desplegá el servicio Node desde la raíz del repositorio con `npm install` y `npm start`.
- En Render, definí `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (la URL pública de Vercel) y las credenciales de Cloudinary. Render provee `PORT` automáticamente.

El checkout todavía no está conectado a una pasarela de pagos. Los pedidos, pagos, correo de verificación y recuperación de contraseña se agregan antes de abrir ventas reales.
