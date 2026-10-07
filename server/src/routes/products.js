import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { deleteProductImage, saveProductImage } from '../services/media.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 2 }, fileFilter: (req, file, cb) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return cb(new Error('Usá una imagen PNG, JPG o WebP.'));
  cb(null, true);
} });
const splitList = (value) => String(value || '').split(',').map((part) => part.trim()).filter(Boolean).slice(0, 30);
const slugify = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);

async function removeBackground(file, productId, side) {
  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  const base = process.env.IMAGE_PROCESSOR_URL || 'http://127.0.0.1:8001';
  const response = await fetch(`${base}/remove-background`, { method: 'POST', body: form, signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`No se pudo recortar la imagen (${response.status}). Revisá que el procesador de imágenes esté iniciado.`);
  const png = Buffer.from(await response.arrayBuffer());
  if (!png.length || png.length > 25 * 1024 * 1024) throw new Error('El procesador devolvió una imagen inválida.');
  return saveProductImage(png, productId, side);
}

function publicProduct(product) {
  return { id: String(product._id), name: product.name, slug: product.slug, description: product.description, category: product.category, price: product.price, compareAtPrice: product.compareAtPrice, stock: product.stock, sizes: product.sizes, colors: product.colors, tags: product.tags, frontImage: product.frontImage, backImage: product.backImage || product.frontImage, featured: product.featured, active: product.active, updatedAt: product.updatedAt };
}

function parseProduct(body) {
  const price = Number(body.price);
  const stock = Number(body.stock || 0);
  const compareAt = body.compareAtPrice === '' || body.compareAtPrice == null ? null : Number(body.compareAtPrice);
  if (!body.name?.trim() || !body.category?.trim()) throw Object.assign(new Error('Completá el nombre y la categoría.'), { status: 400 });
  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || (compareAt !== null && (!Number.isFinite(compareAt) || compareAt < 0))) throw Object.assign(new Error('Revisá el precio, precio anterior y stock.'), { status: 400 });
  return { name: body.name.trim(), description: String(body.description || '').trim(), category: body.category.trim(), price, compareAtPrice: compareAt, stock, sizes: splitList(body.sizes), colors: splitList(body.colors), tags: splitList(body.tags), featured: body.featured === 'true', active: body.active !== 'false' };
}

router.get('/', async (req, res, next) => {
  try {
    const filter = { active: true, ...(req.query.category && req.query.category !== 'Todos' ? { category: String(req.query.category) } : {}) };
    const products = await Product.find(filter).sort({ featured: -1, createdAt: -1 }).limit(100).lean();
    res.json({ products: products.map(publicProduct) });
  } catch (error) { next(error); }
});

router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try { const products = await Product.find().sort({ updatedAt: -1 }).lean(); res.json({ products: products.map(publicProduct) }); }
  catch (error) { next(error); }
});

router.post('/', requireAuth, requireAdmin, upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), async (req, res, next) => {
  const madeFiles = [];
  try {
    const data = parseProduct(req.body);
    const files = req.files || {};
    if (!files.frontImage?.[0]) return res.status(400).json({ error: 'Subí la foto del frente.' });
    const id = crypto.randomUUID();
    data.slug = `${slugify(req.body.slug || data.name)}-${id.slice(0, 6)}`;
    const frontImage = await removeBackground(files.frontImage[0], id, 'front'); madeFiles.push(frontImage);
    data.frontImage = frontImage.url;
    data.frontImagePublicId = frontImage.publicId;
    const backImage = files.backImage?.[0] ? await removeBackground(files.backImage[0], id, 'back') : frontImage;
    if (backImage !== frontImage) madeFiles.push(backImage);
    data.backImage = backImage.url;
    data.backImagePublicId = backImage.publicId;
    const product = await Product.create(data);
    res.status(201).json({ product: publicProduct(product) });
  } catch (error) {
    await Promise.allSettled(madeFiles.map((image) => deleteProductImage(image.url, image.publicId)));
    next(error);
  }
});

router.put('/:id', requireAuth, requireAdmin, upload.fields([{ name: 'frontImage', maxCount: 1 }, { name: 'backImage', maxCount: 1 }]), async (req, res, next) => {
  const madeFiles = [];
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'No encontramos ese producto.' });
    const previousImages = [
      { url: product.frontImage, publicId: product.frontImagePublicId },
      { url: product.backImage, publicId: product.backImagePublicId }
    ].filter((image) => image.url);
    const data = parseProduct(req.body);
    const files = req.files || {};
    if (files.frontImage?.[0]) {
      const image = await removeBackground(files.frontImage[0], product.id, 'front'); madeFiles.push(image);
      data.frontImage = image.url; data.frontImagePublicId = image.publicId;
    } else {
      data.frontImage = product.frontImage; data.frontImagePublicId = product.frontImagePublicId || '';
    }
    if (files.backImage?.[0]) {
      const image = await removeBackground(files.backImage[0], product.id, 'back'); madeFiles.push(image);
      data.backImage = image.url; data.backImagePublicId = image.publicId;
    } else {
      data.backImage = product.backImage || data.frontImage;
      data.backImagePublicId = product.backImagePublicId || data.frontImagePublicId || '';
    }
    Object.assign(product, data);
    await product.save();
    res.json({ product: publicProduct(product) });
    const stillUsed = new Set([product.frontImage, product.backImage, product.frontImagePublicId, product.backImagePublicId].filter(Boolean));
    const oldImages = previousImages.filter((image) => !stillUsed.has(image.url) && (!image.publicId || !stillUsed.has(image.publicId)));
    await Promise.allSettled(oldImages.map((image) => deleteProductImage(image.url, image.publicId)));
  } catch (error) {
    await Promise.allSettled(madeFiles.map((image) => deleteProductImage(image.url, image.publicId)));
    next(error);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'No encontramos ese producto.' });
    const images = new Map([
      [product.frontImagePublicId || product.frontImage, { url: product.frontImage, publicId: product.frontImagePublicId }],
      [product.backImagePublicId || product.backImage, { url: product.backImage, publicId: product.backImagePublicId }]
    ].filter(([key, image]) => key && image.url));
    await Promise.allSettled([...images.values()].map((image) => deleteProductImage(image.url, image.publicId)));
    res.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
