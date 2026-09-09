import { Request, Response } from 'express';
import { env } from '../config/env';
import { getGeneralTracking } from '../services/generalTracking.service';

/**
 * GET  /api/general-tracking?trackingNumber=XXXX
 * POST /api/general-tracking   { "trackingNumber": "XXXX" }
 *
 * GeneralTrackingApi — see services/generalTracking.service.ts. Always answers
 * 200 with the same seven-field shape so a downstream automation (respond.io)
 * can read it without branching on HTTP status; `found` is the flag to branch on.
 */
export async function generalTracking(req: Request, res: Response): Promise<void> {
  // Optional shared-secret gate. Open when GENERAL_TRACKING_API_KEY is unset.
  if (env.GENERAL_TRACKING_API_KEY) {
    const provided = req.get('x-api-key') ?? String(req.query.apiKey ?? '');
    if (provided !== env.GENERAL_TRACKING_API_KEY) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key.' } });
      return;
    }
  }

  const raw =
    req.method === 'POST'
      ? req.body?.trackingNumber ?? req.body?.tracking_number ?? req.body?.number
      : req.query.trackingNumber ?? req.query.tracking_number ?? req.query.number ?? req.query.awb ?? req.query.Awbs;

  const trackingNumber = String(raw ?? '').trim();
  if (!trackingNumber) {
    res.status(400).json({ error: { code: 'MISSING_TRACKING_NUMBER', message: 'trackingNumber is required.' } });
    return;
  }

  const result = await getGeneralTracking(trackingNumber);
  res.status(200).json(result);
}
