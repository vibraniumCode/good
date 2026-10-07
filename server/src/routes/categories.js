import { Router } from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
const toSlug = (value) => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

router.get('/', async (req, res, next) => {
  try { res.json({ categories: await Category.find({ active: true }).sort({ name: 1 }).lean() }); }
  catch (error) { next(error); }
});
router.get('/admin/all', requireAuth, requireAdmin, async (req, res, next) => {
  try { res.json({ categories: await Category.find().sort({ name: 1 }).lean() }); }
  catch (error) { next(error); }
});
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    if (name.length < 2) return res.status(400).json({ error: 'El nombre de la categoría es obligatorio.' });
    const category = await Category.create({ name, slug: toSlug(name) });
    res.status(201).json({ category });
  } catch (error) { next(error); }
});
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'No encontramos esa categoría.' });
    if (await Product.exists({ category: category.name })) return res.status(409).json({ error: 'Esta categoría tiene productos. Cambialos de categoría antes de borrarla.' });
    await category.deleteOne();
    res.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
