import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './server/uploads');
const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

export async function saveProductImage(buffer, productId, side) {
  if (cloudinaryConfigured) {
    const publicId = `${productId}-${side}-${crypto.randomUUID()}`;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: 'good/products',
        public_id: `${productId}-${side}-${crypto.randomUUID()}`,
        resource_type: 'image',
        format: 'png',
        overwrite: false
      }, (error, uploaded) => error ? reject(error) : resolve(uploaded));
      stream.end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id || `good/products/${publicId}` };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configurá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET para guardar imágenes en producción.');
  }

  await fs.mkdir(uploadRoot, { recursive: true });
  const filename = `${productId}-${side}-${crypto.randomUUID()}.png`;
  await fs.writeFile(path.join(uploadRoot, filename), buffer, { flag: 'wx' });
  return { url: `/uploads/${filename}`, publicId: '' };
}

export async function deleteProductImage(url, publicId = '') {
  if (publicId && cloudinaryConfigured) {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return;
  }
  if (url?.startsWith('/uploads/')) {
    await fs.rm(path.join(uploadRoot, path.basename(url)), { force: true });
  }
}
