import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import Category from './models/Category.js';
import Product from './models/Product.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const uploadDir = path.resolve(root, process.env.UPLOAD_DIR || './server/uploads');
const clientDist = path.join(root, 'client', 'dist');
const clientPublic = path.join(root, 'client', 'public');

app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: { directives: {
    defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:', 'blob:', 'https:'], connectSrc: ["'self'"],
    objectSrc: ["'none'"], baseUri: ["'self'"], frameAncestors: ["'none'"]
  } }
}));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir, { fallthrough: false, maxAge: '7d', immutable: true }));
app.use('/assets', express.static(fs.existsSync(path.join(clientDist, 'assets')) ? path.join(clientDist, 'assets') : path.join(clientPublic, 'assets'), { maxAge: '1d' }));
app.get('/api/health', (req, res) => res.json({ ok: true, database: mongoose.connection.readyState === 1 }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false }));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.name === 'ValidationError') return res.status(400).json({ error: 'Revisá los datos del formulario.' });
  if (error.code === 11000) return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'La imagen no puede superar 12 MB.' });
  if (error.status) return res.status(error.status).json({ error: error.message });
  res.status(500).json({ error: 'Hubo un problema. Probá de nuevo.' });
});

async function seedShop() {
  const names = ['Buzos', 'Remeras', 'Pantalones', 'Accesorios'];
  for (const name of names) {
    const slug = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
    await Category.updateOne({ slug }, { $setOnInsert: { name, slug, active: true } }, { upsert: true });
  }
  if (await Product.estimatedDocumentCount() === 0) {
    await Product.create({ name: 'Buzo Borovi', slug: 'buzo-borovi', description: 'Hoodie charcoal de calce relajado, para sumar abrigo sin perder comodidad.', category: 'Buzos', price: 68900, compareAtPrice: null, stock: 18, sizes: ['S', 'M', 'L', 'XL'], colors: ['Charcoal'], tags: ['Nuevo', 'Edición limitada'], frontImage: '/assets/buzo-borovi-cutout.png', backImage: '/assets/buzo-borovi-cutout.png', featured: true, active: true });
  }
}

if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('USUARIO:CONTRASENA')) {
  console.error('Falta MONGODB_URI. Completá outputs/good-store/.env con tu conexión de MongoDB Atlas.');
  process.exit(1);
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.startsWith('REEMPLAZAR_')) {
  console.error('Falta JWT_SECRET. Agregá un secreto aleatorio en outputs/good-store/.env.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  await seedShop();
  app.listen(port, () => console.log(`GOOD API disponible en http://localhost:${port}`));
} catch (error) {
  console.error('No se pudo conectar a MongoDB:', error.message);
  process.exit(1);
}
