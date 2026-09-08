import { Request, Response } from 'express';
import { getPool, sql } from '../config/database';

/** GET /api/resource-sections?categoryCode=xxx&active=true */
export async function listSections(req: Request, res: Response): Promise<void> {
  try {
    const categoryCode = req.query.categoryCode as string | undefined;
    const activeOnly = req.query.active === 'true';
    const request = (await getPool()).request();
    const conditions: string[] = [];

    if (categoryCode) {
      request.input('categoryCode', sql.NVarChar(100), categoryCode.trim());
      conditions.push('category_code = @categoryCode');
    }
    if (activeOnly) conditions.push('is_active = 1');

    let query = 'SELECT id, category_code, title_ar, title_en, sort_order, is_active FROM [dbo].[resource_sections]';
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
    query += ' ORDER BY category_code, sort_order, id';

    const result = await request.query(query);
    res.json({ sections: result.recordset });
  } catch (err) {
    const anyErr = err as { code?: string; message?: string };
    const isDbError = anyErr?.code === 'ECONNREFUSED' ||
      anyErr?.code === 'ESOCKET' ||
      anyErr?.code === 'ETIMEOUT' ||
      String(anyErr?.message ?? '').toLowerCase().includes('connection');
    if (isDbError) {
      res.json({ sections: [] });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch resource sections' });
  }
}

/** POST /api/resource-sections */
export async function createSection(req: Request, res: Response): Promise<void> {
  try {
    const { categoryCode, titleAr, titleEn, sortOrder } = req.body as Record<string, unknown>;
    if (!categoryCode || typeof categoryCode !== 'string' || !categoryCode.trim()) {
      res.status(400).json({ error: 'categoryCode is required' });
      return;
    }
    if (!titleAr || typeof titleAr !== 'string' || !titleAr.trim()) {
      res.status(400).json({ error: 'titleAr is required' });
      return;
    }

    const result = await (await getPool()).request()
      .input('categoryCode', sql.NVarChar(100), categoryCode.trim())
      .input('titleAr', sql.NVarChar(200), titleAr.trim())
      .input('titleEn', sql.NVarChar(200), titleEn ? String(titleEn).trim() : null)
      .input('sortOrder', sql.Int, Number(sortOrder ?? 0))
      .query(`INSERT INTO [dbo].[resource_sections] (category_code, title_ar, title_en, sort_order)
              OUTPUT INSERTED.*
              VALUES (@categoryCode, @titleAr, @titleEn, @sortOrder)`);

    res.status(201).json({ section: result.recordset[0] });
  } catch (err) {
    const anyErr = err as { number?: number };
    if (anyErr.number === 2627 || anyErr.number === 2601) {
      res.status(409).json({ error: 'A section with this Arabic title already exists in this card' });
      return;
    }
    res.status(500).json({ error: 'Failed to create resource section' });
  }
}

/** PATCH /api/resource-sections/:id — partial update; `isActive` toggles public visibility */
export async function updateSection(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

    const { titleAr, titleEn, sortOrder, isActive } = req.body as Record<string, unknown>;
    const sets: string[] = [];
    const request = (await getPool()).request().input('id', sql.Int, id);

    if (titleAr !== undefined) {
      request.input('titleAr', sql.NVarChar(200), String(titleAr).trim());
      sets.push('title_ar = @titleAr');
    }
    if (titleEn !== undefined) {
      request.input('titleEn', sql.NVarChar(200), titleEn ? String(titleEn).trim() : null);
      sets.push('title_en = @titleEn');
    }
    if (sortOrder !== undefined) {
      request.input('sortOrder', sql.Int, Number(sortOrder));
      sets.push('sort_order = @sortOrder');
    }
    if (isActive !== undefined) {
      request.input('isActive', sql.Bit, isActive ? 1 : 0);
      sets.push('is_active = @isActive');
    }

    if (!sets.length) { res.status(400).json({ error: 'No fields to update' }); return; }

    const result = await request.query(
      `UPDATE [dbo].[resource_sections] SET ${sets.join(', ')}
       OUTPUT INSERTED.id, INSERTED.category_code, INSERTED.title_ar, INSERTED.title_en, INSERTED.sort_order, INSERTED.is_active
       WHERE id = @id`
    );

    if (!result.recordset.length) { res.status(404).json({ error: 'Section not found' }); return; }
    res.json({ section: result.recordset[0] });
  } catch (err) {
    const anyErr = err as { number?: number };
    if (anyErr.number === 2627 || anyErr.number === 2601) {
      res.status(409).json({ error: 'A section with this Arabic title already exists in this card' });
      return;
    }
    res.status(500).json({ error: 'Failed to update resource section' });
  }
}
