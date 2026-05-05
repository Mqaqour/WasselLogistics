import { Request, Response, NextFunction } from 'express';
import { getResourceSearchResponse } from '../services/ai-agent.service';

export async function resourceSearch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = String(req.body?.query ?? '').trim();
    if (!query) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'query is required',
        },
      });
      return;
    }

    const result = await getResourceSearchResponse(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
