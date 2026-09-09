import { Request, Response } from 'express';
import { getCustomsCase } from '../services/customsCase.service';

const AWB_RE = /^[A-Za-z0-9-]{4,40}$/;

/**
 * GET /api/customs-case?awb=XXXX[&carrier=fedex|dhl|aramex|other]
 *
 * Thin proxy to the WasselCustoms public tracking API — see
 * services/customsCase.service.ts. Always answers 200 with the
 * `{ hasOpenCase, cases }` shape (bad input included) so the tracking page
 * never has to branch on HTTP status; it just checks `hasOpenCase`.
 */
export async function customsCase(req: Request, res: Response): Promise<void> {
  const awb = String(req.query.awb ?? '').trim();
  const carrier = req.query.carrier ? String(req.query.carrier).trim() : undefined;

  if (!AWB_RE.test(awb)) {
    res.status(200).json({ hasOpenCase: false, cases: [] });
    return;
  }

  res.status(200).json(await getCustomsCase(awb, carrier));
}
