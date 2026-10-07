import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('USUARIO:CONTRASENA')) throw new Error('Completá MONGODB_URI en .env.');
if (!email || password.length < 14 || password === 'CAMBIAR_ESTA_CLAVE') throw new Error('Definí ADMIN_EMAIL y una ADMIN_PASSWORD de al menos 14 caracteres en .env.');

await mongoose.connect(process.env.MONGODB_URI);
const found = await User.findOne({ email });
if (found) {
  found.role = 'admin';
  await found.save();
  console.log(`La cuenta ${email} ya existía; ahora tiene rol admin. Su contraseña no cambió.`);
} else {
  await User.create({ name: 'GOOD Admin', email, passwordHash: await bcrypt.hash(password, 12), role: 'admin' });
  console.log(`Administrador creado: ${email}`);
}
await mongoose.disconnect();
