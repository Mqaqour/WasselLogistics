// ─────────────────────────────────────────────────────────────────────────────
// Resource Categories Controller
// CRUD for the [resource_categories] table (admin + public read).
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { getPool, sql } from '../config/database';

// ── GET /api/resource-categories ─────────────────────────────────────────────
// Public: pass ?active=true to only return visible cards.
// Admin (no filter): returns all including hidden.
export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const pool = await getPool();
    const activeOnly = req.query.active === 'true';

    const query = activeOnly
      ? `SELECT id, code, title_ar, title_en, description_ar, description_en,
                image_url, sort_order, is_active
           FROM [dbo].[resource_categories]
          WHERE is_active = 1
          ORDER BY sort_order, id`
      : `SELECT id, code, title_ar, title_en, description_ar, description_en,
                image_url, sort_order, is_active
           FROM [dbo].[resource_categories]
          ORDER BY sort_order, id`;

    const result = await pool.request().query<{
      id: number;
      code: string;
      title_ar: string;
      title_en: string | null;
      description_ar: string | null;
      description_en: string | null;
      image_url: string | null;
      sort_order: number;
      is_active: boolean;
    }>(query);

    res.json({ categories: result.recordset });
  } catch (err) {
    // DB unavailable — return empty list so the page still loads
    const anyErr = err as { code?: string; message?: string };
    const isDbError = anyErr?.code === 'ECONNREFUSED' ||
      anyErr?.code === 'ESOCKET' ||
      anyErr?.code === 'ETIMEOUT' ||
      String(anyErr?.message ?? '').toLowerCase().includes('connection');
    if (isDbError) {
      res.json({ categories: [] });
      return;
    }
    next(err);
  }
}

// ── POST /api/resource-categories ────────────────────────────────────────────
export async function createCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { code, titleAr, titleEn, descriptionAr, descriptionEn, imageUrl, sortOrder } = req.body as {
      code?: string;
      titleAr?: string;
      titleEn?: string;
      descriptionAr?: string;
      descriptionEn?: string;
      imageUrl?: string;
      sortOrder?: number;
    };

    if (!code?.trim() || !titleAr?.trim()) {
      res.status(400).json({ error: 'code and titleAr are required' });
      return;
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('code',          sql.NVarChar(100),  code.trim())
      .input('titleAr',       sql.NVarChar(255),  titleAr.trim())
      .input('titleEn',       sql.NVarChar(255),  titleEn?.trim()       || null)
      .input('descriptionAr', sql.NVarChar(sql.MAX), descriptionAr?.trim() || null)
      .input('descriptionEn', sql.NVarChar(sql.MAX), descriptionEn?.trim() || null)
      .input('imageUrl',      sql.NVarChar(sql.MAX), imageUrl?.trim()       || null)
      .input('sortOrder',     sql.Int,            sortOrder ?? 0)
      .query<{ id: number }>(`
        INSERT INTO [dbo].[resource_categories]
          (code, title_ar, title_en, description_ar, description_en, image_url, sort_order)
        OUTPUT INSERTED.id
        VALUES (@code, @titleAr, @titleEn, @descriptionAr, @descriptionEn, @imageUrl, @sortOrder)
      `);

    res.status(201).json({ categoryId: result.recordset[0].id });
  } catch (err: unknown) {
    const mssqlErr = err as { number?: number };
    if (mssqlErr.number === 2627 || mssqlErr.number === 2601) {
      res.status(409).json({ error: 'A category with this code already exists' });
      return;
    }
    next(err);
  }
}

// ── PATCH /api/resource-categories/:id ───────────────────────────────────────
export async function updateCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }

    const { titleAr, titleEn, descriptionAr, descriptionEn, imageUrl, sortOrder, isActive } = req.body as {
      titleAr?: string;
      titleEn?: string;
      descriptionAr?: string;
      descriptionEn?: string;
      imageUrl?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const setParts: string[] = [];

    const pool = await getPool();
    const request = pool.request().input('id', sql.Int, id);

    if (titleAr       !== undefined) { setParts.push('title_ar       = @titleAr');       request.input('titleAr',       sql.NVarChar(255),       titleAr?.trim() || null); }
    if (titleEn       !== undefined) { setParts.push('title_en       = @titleEn');       request.input('titleEn',       sql.NVarChar(255),       titleEn?.trim() || null); }
    if (descriptionAr !== undefined) { setParts.push('description_ar = @descriptionAr'); request.input('descriptionAr', sql.NVarChar(sql.MAX),    descriptionAr?.trim() || null); }
    if (descriptionEn !== undefined) { setParts.push('description_en = @descriptionEn'); request.input('descriptionEn', sql.NVarChar(sql.MAX),    descriptionEn?.trim() || null); }
    if (imageUrl      !== undefined) { setParts.push('image_url      = @imageUrl');      request.input('imageUrl',      sql.NVarChar(sql.MAX),    imageUrl?.trim() || null); }
    if (sortOrder     !== undefined) { setParts.push('sort_order     = @sortOrder');     request.input('sortOrder',     sql.Int,                  sortOrder); }
    if (isActive      !== undefined) { setParts.push('is_active      = @isActive');      request.input('isActive',      sql.Bit,                  isActive ? 1 : 0); }

    if (!setParts.length) { res.status(400).json({ error: 'Nothing to update' }); return; }

    await request.query(`UPDATE [dbo].[resource_categories] SET ${setParts.join(', ')} WHERE id = @id`);
    res.json({ updated: true });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/resource-categories/:id ──────────────────────────────────────
export async function deleteCategory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }

    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM [dbo].[resource_categories] WHERE id = @id');

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
}
