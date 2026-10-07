# GOOD — tienda online

Tienda de ropa responsive con frontend React/Vite, API Express, MongoDB/Mongoose, sesiones firmadas en cookie segura y un servicio Python local para quitar el fondo de las fotos de producto.

## Antes de iniciar

1. Instalá Node.js 22 o posterior y Python 3.13.
2. Creá una base MongoDB (por ejemplo en Atlas), un usuario de base de datos y autorizá tu IP en Network Access.
3. Editá el archivo `.env` de esta carpeta. Reemplazá `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Poné una contraseña administrativa de al menos 14 caracteres. No compartas el `.env` ni lo subas a Git.
4. Completá `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en `.env`. Las imágenes procesadas se guardan en Cloudinary cuando esas tres credenciales están configuradas; el secreto se usa solo en el servidor.
5. En la URI de MongoDB, reemplazá también el nombre del cluster y la base; codificá caracteres especiales de la contraseña (por ejemplo `@` como `%40`).

## Ejecutar en Windows PowerShell

Desde esta carpeta:

```powershell
npm install
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r processor\requirements.txt
$env:Path = "$PWD\.venv\Scripts;$env:Path"
npm run seed:admin
npm run dev
```

Abrí `http://localhost:5173`. El panel está en `http://localhost:5173/admin`. El comando `seed:admin` crea la cuenta que pusiste en `.env`; las cuentas que se registran desde la tienda siempre quedan como clientes.

El primer inicio del procesador de imágenes descarga el modelo U2-Net (aprox. 176 MB). El modelo se guarda en caché local; después procesa las imágenes en el equipo. En el panel, cargá la foto frontal y, si la tenés, también la trasera. Al guardar, ambas se recortan a PNG con transparencia, se suben a Cloudinary y se muestran completas en la ficha.

## Qué incluye

- Registro e inicio de sesión para clientes; la contraseña se almacena con hash y la sesión usa cookie `HttpOnly`.
- Acceso administrador preparado con cuenta inicial por `.env` y rol protegido en el servidor.
- Alta, edición y baja de productos con precios, precio anterior, categoría, stock, talles, colores, etiquetas, descripción, publicación y producto destacado.
- Alta y baja de categorías.
- Carga de una imagen de frente y otra del dorso, con recorte de fondo automático y almacenamiento en Cloudinary.
- Vista de producto con selector frente/dorso cuando existen las dos fotos; las tarjetas usan `object-fit: contain` para mostrar la prenda completa.
- Carrito de cliente en el navegador.

## Producción

Configurá `NODE_ENV=production`, la URL pública en `CLIENT_ORIGIN`, una `JWT_SECRET` nueva, una URI real de MongoDB y las tres credenciales de Cloudinary. Luego ejecutá `npm run build` y `npm start`. El procesador Python se inicia aparte con el mismo entorno virtual:

```powershell
$env:Path = "$PWD\.venv\Scripts;$env:Path"
python -m uvicorn processor.main:app --host 127.0.0.1 --port 8001
```

Cloudinary conserva las fotos fuera del filesystem efímero del servidor; MongoDB guarda las URLs seguras y los identificadores de los assets. En desarrollo, si las credenciales Cloudinary están vacías, las imágenes se guardan localmente en `server/uploads`.

El checkout todavía no está conectado a una pasarela de pagos. Los pedidos, pagos, correo de verificación y recuperación de contraseña se agregan antes de abrir ventas reales.
