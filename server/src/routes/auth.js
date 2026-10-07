import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { issueSession, publicUser, requireAuth, sessionCookieOptions } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Probá de nuevo en unos minutos.' } });
router.use(authLimiter);

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 100) return res.status(400).json({ error: 'Escribí tu nombre.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Revisá el email.' });
    if (password.length < 10) return res.status(400).json({ error: 'La contraseña debe tener al menos 10 caracteres.' });
    if (await User.exists({ email })) return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'customer' });
    issueSession(res, user.id);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    issueSession(res, user.id);
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('good_session', { ...sessionCookieOptions(), maxAge: undefined });
  res.json({ ok: true });
});

export default router;
