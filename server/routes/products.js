// ============================================
// API נתיבים למוצרים
// GET  /api/products            - רשימת מוצרים (+ פילטרים)
// GET  /api/products/:handle    - מוצר בודד לפי handle (slug)
// ============================================
import express from 'express';
import { getSupabase } from '../db/supabase.js';
import { mockProducts } from '../db/mock-data.js';
import { usingPlaceholders } from '../config.js';

const router = express.Router();

// -------- GET /api/products --------
// Query params:
//   ?type=pla|silk|petg|...    - סינון לפי סוג
//   ?featured=true             - רק מוצרים מומלצים
//   ?search=text               - חיפוש בשם
//   ?limit=20                  - מספר תוצאות מקסימלי
router.get('/', async (req, res, next) => {
  try {
    const { type, featured, search } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 100, 200);

    // ----- מצב Mock -----
    if (usingPlaceholders.supabase) {
      let products = mockProducts.filter(p => p.is_active);
      if (type) products = products.filter(p => p.type === type);
      if (featured === 'true') products = products.filter(p => p.is_featured);
      if (search) {
        const q = search.toLowerCase();
        products = products.filter(p => p.name.toLowerCase().includes(q));
      }
      products.sort((a, b) => a.sort_order - b.sort_order);
      return res.json({
        products: products.slice(0, limit),
        count: products.length,
        source: 'mock',
      });
    }

    // ----- מצב Supabase אמיתי -----
    const sb = getSupabase();
    let query = sb.from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(limit);

    if (type) query = query.eq('type', type);
    if (featured === 'true') query = query.eq('is_featured', true);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ products: data, count: count ?? data.length, source: 'supabase' });
  } catch (err) {
    next(err);
  }
});

// -------- GET /api/products/:handle --------
router.get('/:handle', async (req, res, next) => {
  try {
    const { handle } = req.params;

    if (usingPlaceholders.supabase) {
      const product = mockProducts.find(p => p.handle === handle && p.is_active);
      if (!product) return res.status(404).json({ error: 'מוצר לא נמצא' });
      return res.json({ product, source: 'mock' });
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('products')
      .select('*')
      .eq('handle', handle)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'מוצר לא נמצא' });
    res.json({ product: data, source: 'supabase' });
  } catch (err) {
    next(err);
  }
});

export default router;
