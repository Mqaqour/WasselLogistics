import { Request, Response } from 'express';
import { getPool, sql } from '../config/database';

/** GET /api/resource-sub-items?categoryCode=xxx&active=true */
export async function listSubItems(req: Request, res: Response): Promise<void> {
  try {
    const pool = await getPool();
    const request = pool.request();

    const categoryCode = req.query.categoryCode as string | undefined;
    const activeOnly   = req.query.active === 'true';

    let query = 'SELECT id, category_code, title_ar, title_en, description_ar, description_en, question_id, section_ar, section_en, sort_order, is_active FROM [dbo].[resource_sub_items]';
    const conditions: string[] = [];

    if (categoryCode) {
      request.input('categoryCode', sql.NVarChar, categoryCode);
      conditions.push('category_code = @categoryCode');
    }
    if (activeOnly) {
      conditions.push('is_active = 1');
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY category_code, sort_order, id';

    const result = await request.query(query);
    res.json({ items: result.recordset });
  } catch (err) {
    // DB unavailable — return empty list so the page still loads
    const anyErr = err as { code?: string; message?: string };
    const isDbError = anyErr?.code === 'ECONNREFUSED' ||
      anyErr?.code === 'ESOCKET' ||
      anyErr?.code === 'ETIMEOUT' ||
      String(anyErr?.message ?? '').toLowerCase().includes('connection');
    if (isDbError) {
      res.json({ items: [] });
      return;
    }
    res.status(500).json({ error: 'Failed to fetch sub-items' });
  }
}

/** POST /api/resource-sub-items */
export async function createSubItem(req: Request, res: Response): Promise<void> {
  try {
    const { categoryCode, titleAr, titleEn, descriptionAr, descriptionEn, questionId, sectionAr, sectionEn, sortOrder } = req.body as Record<string, unknown>;
    if (!categoryCode || typeof categoryCode !== 'string' || !categoryCode.trim()) {
      res.status(400).json({ error: 'categoryCode is required' });
      return;
    }
    if (!titleAr || typeof titleAr !== 'string' || !titleAr.trim()) {
      res.status(400).json({ error: 'titleAr is required' });
      return;
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('categoryCode',   sql.NVarChar(100),  categoryCode.trim())
      .input('titleAr',        sql.NVarChar(500),  (titleAr as string).trim())
      .input('titleEn',        sql.NVarChar(500),  titleEn ? String(titleEn).trim() : null)
      .input('descriptionAr',  sql.NVarChar(1000), descriptionAr ? String(descriptionAr).trim() : null)
      .input('descriptionEn',  sql.NVarChar(1000), descriptionEn ? String(descriptionEn).trim() : null)
      .input('questionId',     sql.Int,             questionId != null ? Number(questionId) : null)
      .input('sectionAr',      sql.NVarChar(200),  sectionAr ? String(sectionAr).trim() : null)
      .input('sectionEn',      sql.NVarChar(200),  sectionEn ? String(sectionEn).trim() : null)
      .input('sortOrder',      sql.Int,             Number(sortOrder ?? 0))
      .query(`INSERT INTO [dbo].[resource_sub_items]
                (category_code, title_ar, title_en, description_ar, description_en, question_id, section_ar, section_en, sort_order)
              OUTPUT INSERTED.*
              VALUES (@categoryCode, @titleAr, @titleEn, @descriptionAr, @descriptionEn, @questionId, @sectionAr, @sectionEn, @sortOrder)`);

    res.status(201).json({ item: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sub-item' });
  }
}

/** PATCH /api/resource-sub-items/:id */
export async function updateSubItem(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

    const { categoryCode, titleAr, titleEn, descriptionAr, descriptionEn, questionId, sectionAr, sectionEn, sortOrder, isActive } = req.body as Record<string, unknown>;
    const sets: string[] = [];
    const request = (await getPool()).request().input('id', sql.Int, id);

    if (categoryCode !== undefined) {
      request.input('categoryCode', sql.NVarChar(100), String(categoryCode).trim());
      sets.push('category_code = @categoryCode');
    }

    if (titleAr !== undefined) {
      request.input('titleAr', sql.NVarChar(500), String(titleAr).trim());
      sets.push('title_ar = @titleAr');
    }
    if (titleEn !== undefined) {
      request.input('titleEn', sql.NVarChar(500), titleEn ? String(titleEn).trim() : null);
      sets.push('title_en = @titleEn');
    }
    if (descriptionAr !== undefined) {
      request.input('descriptionAr', sql.NVarChar(1000), descriptionAr ? String(descriptionAr).trim() : null);
      sets.push('description_ar = @descriptionAr');
    }
    if (descriptionEn !== undefined) {
      request.input('descriptionEn', sql.NVarChar(1000), descriptionEn ? String(descriptionEn).trim() : null);
      sets.push('description_en = @descriptionEn');
    }
    if (questionId !== undefined) {
      request.input('questionId', sql.Int, questionId != null ? Number(questionId) : null);
      sets.push('question_id = @questionId');
    }
    if (sectionAr !== undefined) {
      request.input('sectionAr', sql.NVarChar(200), sectionAr ? String(sectionAr).trim() : null);
      sets.push('section_ar = @sectionAr');
    }
    if (sectionEn !== undefined) {
      request.input('sectionEn', sql.NVarChar(200), sectionEn ? String(sectionEn).trim() : null);
      sets.push('section_en = @sectionEn');
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
      `UPDATE [dbo].[resource_sub_items] SET ${sets.join(', ')} OUTPUT INSERTED.* WHERE id = @id`
    );

    if (!result.recordset.length) { res.status(404).json({ error: 'Sub-item not found' }); return; }
    res.json({ item: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update sub-item' });
  }
}

/** DELETE /api/resource-sub-items/:id */
export async function deleteSubItem(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM [dbo].[resource_sub_items] OUTPUT DELETED.id WHERE id = @id');

    if (!result.recordset.length) { res.status(404).json({ error: 'Sub-item not found' }); return; }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete sub-item' });
  }
}
