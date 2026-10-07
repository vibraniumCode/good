import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const cookieName = 'good_session';

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
}

export function issueSession(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(cookieName, token, sessionCookieOptions());
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[cookieName];
    if (!token) return res.status(401).json({ error: 'Iniciá sesión para continuar.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'La sesión ya no es válida.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'La sesión ya no es válida.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Necesitás permisos de administrador.' });
  next();
}

export function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}
