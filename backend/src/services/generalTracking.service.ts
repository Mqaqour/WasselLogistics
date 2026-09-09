// ─────────────────────────────────────────────────────────────────────────────
// GeneralTrackingApi
//
// One tracking endpoint for external consumers (respond.io): the caller passes a
// tracking number, we work out which carrier it belongs to from its format, call
// that carrier's upstream, and return a tiny normalized summary — last status,
// its date, the shipment's creation date, the last location, the next required
// action (if any), and which system answered.
//
// Anything we can't determine comes back as the literal string "Not available".
//
// The per-carrier field mapping mirrors the browser parsers in
// components/shipping/Tracking.tsx, which are the battle-tested source of truth
// for each upstream's shape.
// ─────────────────────────────────────────────────────────────────────────────
import https from 'https';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { wasselAwbDetailsUrl, wasselAwbHeaders } from '../utils/wasselAwb';

export const NOT_AVAILABLE = 'Not available';

export type TrackingSource = 'Wassel' | 'DHL' | 'FedEx' | 'JOPASSPORT';

export interface GeneralTrackingResult {
  trackingNumber: string;
  found: boolean;
  /** Which system answered — or "Not available" when nothing did. */
  source: TrackingSource | typeof NOT_AVAILABLE;
  lastStatus: string;
  lastStatusDate: string;
  creationDate: string;
  lastStatusLocation: string;
  requiredAction: string;
}

type Carrier = 'wassel' | 'dhl' | 'fedex' | 'passport';

// ── Carrier detection (ported from Tracking.tsx `detectCarrier`) ──────────────

const isJordanPassportNumber = (id: string): boolean => {
  const upper = id.trim().toUpperCase();
  return upper.length === 13 && (upper.startsWith('QW') || upper.startsWith('RA')) && upper.endsWith('JO');
};

/**
 * Routes a tracking number to a carrier by its known number format, most-specific
 * first. Unrecognized formats fall back to Wassel (same as the website).
 */
export const detectCarrier = (id: string): Carrier => {
  const trimmed = id.trim();
  const upper = trimmed.toUpperCase();

  if (isJordanPassportNumber(trimmed)) return 'passport';
  if (trimmed.length === 12 && trimmed.startsWith('88')) return 'wassel';
  if (trimmed.length === 10 && trimmed.startsWith('500')) return 'wassel';
  if (upper.length === 21 && upper.startsWith('JDD')) return 'dhl';
  if (trimmed.length === 10) return 'dhl';
  if (trimmed.length === 12) return 'fedex';
  return 'wassel';
};

// ── Small shared helpers ─────────────────────────────────────────────────────

const clean = (v: unknown): string => {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
  return s.length > 0 ? s : NOT_AVAILABLE;
};

/** Joins a date and a time part, tolerating either being missing/blank. */
const joinDateTime = (date: unknown, time?: unknown): string => {
  const d = typeof date === 'string' ? date.trim() : '';
  const t = typeof time === 'string' ? time.trim() : '';
  const joined = [d, t].filter(Boolean).join(' ');
  return joined || NOT_AVAILABLE;
};

const parseTime = (value: string): number => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
};

/**
 * Best-effort "what does the customer need to do next" derived from status text.
 * Returns "Not available" when nothing actionable is recognized.
 */
const requiredActionFrom = (...parts: Array<string | undefined>): string => {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  if (!text) return NOT_AVAILABLE;

  if (text.includes('document') || text.includes('مستند')) {
    return 'Provide the required documents for customs clearance';
  }
  if (text.includes('clearance instruction') || text.includes('customs') || text.includes('duty') || text.includes('tax') || text.includes('رسوم') || text.includes('جمرك')) {
    return 'Customs fees / clearance action required';
  }
  if (text.includes('cod') || text.includes('cash on delivery') || text.includes('الدفع عند')) {
    return 'Pay the cash-on-delivery amount';
  }
  if (text.includes('down payment') || text.includes('دفعة مقدمة') || text.includes('دفعه مقدمه')) {
    return 'Pay the required down payment';
  }
  if (text.includes('hold') || text.includes('held') || text.includes('معلق') || text.includes('معلّق')) {
    return 'Shipment on hold — please contact support';
  }
  if (text.includes('address') && (text.includes('incorrect') || text.includes('unable') || text.includes('confirm'))) {
    return 'Confirm or correct the delivery address';
  }
  return NOT_AVAILABLE;
};

/** A delivered shipment has no outstanding action, whatever keywords the text holds. */
const looksDelivered = (...parts: Array<string | undefined>): boolean => {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  return text.includes('delivered') || text.includes('تم التسليم') || text.includes('تم التوصيل');
};

const emptyResult = (trackingNumber: string): GeneralTrackingResult => ({
  trackingNumber,
  found: false,
  source: NOT_AVAILABLE,
  lastStatus: NOT_AVAILABLE,
  lastStatusDate: NOT_AVAILABLE,
  creationDate: NOT_AVAILABLE,
  lastStatusLocation: NOT_AVAILABLE,
  requiredAction: NOT_AVAILABLE,
});

// ── Wassel (internal GetAwbDetails, Basic auth) ──────────────────────────────

async function trackWassel(trackingNumber: string): Promise<GeneralTrackingResult | null> {
  const upstream = await fetch(wasselAwbDetailsUrl(trackingNumber), { method: 'GET', headers: wasselAwbHeaders() });
  const payload = (await upstream.json().catch(() => ({}))) as {
    isSuccess?: boolean;
    data?: Array<Record<string, any>>;
  };
  const record = Array.isArray(payload.data) ? payload.data[0] : undefined;
  if (!upstream.ok || !payload.isSuccess || !record || record.bStatus === 'not_found') return null;

  // destinationLog is newest-first: [0] = latest scan, last = the first ("Draft
  // Shipment") entry, which is the closest thing to a creation timestamp.
  const logs: Array<Record<string, any>> = Array.isArray(record.destinationLog) ? record.destinationLog : [];
  const latest = logs[0] ?? record.lastDestinationLog ?? {};
  const earliest = logs.length > 0 ? logs[logs.length - 1] : {};
  const status = latest.portalDescription || record.status || '';
  const delivered = record.isDelivered === true || looksDelivered(status);

  return {
    trackingNumber,
    found: true,
    source: 'Wassel',
    lastStatus: clean(status),
    lastStatusDate: joinDateTime(latest.statusDate, latest.statusTime),
    creationDate: logs.length > 0 ? joinDateTime(earliest.statusDate, earliest.statusTime) : NOT_AVAILABLE,
    lastStatusLocation: clean(latest.location || latest.terminal),
    requiredAction: delivered
      ? NOT_AVAILABLE
      : record.isOnHoldForTrace
        ? 'Shipment on hold — please contact support'
        : requiredActionFrom(status),
  };
}

// ── DHL (MyDHL API, Basic auth) ─────────────────────────────────────────────

async function trackDhl(trackingNumber: string): Promise<GeneralTrackingResult | null> {
  if (!env.DHL_API_KEY || !env.DHL_API_SECRET) {
    logger.warn('GeneralTrackingApi: DHL credentials not configured');
    return null;
  }
  const baseUrl = env.DHL_ENVIRONMENT === 'sandbox'
    ? 'https://express.api.dhl.com/mydhlapi/test'
    : 'https://express.api.dhl.com/mydhlapi';
  const basicAuth = Buffer.from(`${env.DHL_API_KEY}:${env.DHL_API_SECRET}`).toString('base64');

  const upstream = await fetch(`${baseUrl}/shipments/${encodeURIComponent(trackingNumber)}/tracking`, {
    headers: {
      Authorization: `Basic ${basicAuth}`,
      Accept: 'application/json',
      'Accept-Language': 'en',
      'Message-Reference': uuidv4(),
      'Message-Reference-Date': new Date().toISOString(),
      'x-version': env.DHL_API_VERSION,
      'Plugin-Name': env.DHL_PLUGIN_NAME,
      'Plugin-Version': env.DHL_PLUGIN_VERSION,
      'Shipping-System-Platform-Name': env.DHL_PLATFORM_NAME,
      'Shipping-System-Platform-Version': env.DHL_PLATFORM_VERSION,
      'Webstore-Platform-Name': env.DHL_PLATFORM_NAME,
      'Webstore-Platform-Version': env.DHL_PLATFORM_VERSION,
    },
  });
  const data = (await upstream.json().catch(() => ({}))) as { shipments?: Array<Record<string, any>> };
  const shipment = data.shipments?.[0];
  if (!upstream.ok || !shipment) return null;

  const events: Array<Record<string, any>> = Array.isArray(shipment.events) ? shipment.events : [];
  const sorted = [...events].sort(
    (a, b) => parseTime(`${b?.date}T${b?.time}`) - parseTime(`${a?.date}T${a?.time}`),
  );
  const latest = sorted[0] ?? {};
  const earliest = sorted.length > 0 ? sorted[sorted.length - 1] : {};
  const placeOf = (e: Record<string, any>): string =>
    e?.serviceArea?.[0]?.description || e?.location?.address?.addressLocality || '';

  return {
    trackingNumber,
    found: true,
    source: 'DHL',
    lastStatus: clean(latest.description),
    lastStatusDate: joinDateTime(latest.date, latest.time),
    creationDate: sorted.length > 0 ? joinDateTime(earliest.date, earliest.time) : NOT_AVAILABLE,
    lastStatusLocation: clean(placeOf(latest)),
    requiredAction: looksDelivered(latest.description, shipment.status?.statusCode)
      ? NOT_AVAILABLE
      : requiredActionFrom(latest.description, latest.statusCode),
  };
}

// ── FedEx (Track API v1, OAuth2 client-credentials) ─────────────────────────

let fedexTokenCache: { token: string; expiresAt: number } | null = null;

async function getFedexAccessToken(): Promise<string> {
  if (fedexTokenCache && fedexTokenCache.expiresAt > Date.now() + 30_000) return fedexTokenCache.token;
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.FEDEX_TRACK_CLIENT_ID,
    client_secret: env.FEDEX_TRACK_CLIENT_SECRET,
  });
  const tokenRes = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!tokenRes.ok) throw new Error(`FedEx auth failed with status ${tokenRes.status}`);
  const tokenData = (await tokenRes.json()) as { access_token: string; expires_in: number };
  fedexTokenCache = { token: tokenData.access_token, expiresAt: Date.now() + tokenData.expires_in * 1000 };
  return tokenData.access_token;
}

async function trackFedex(trackingNumber: string): Promise<GeneralTrackingResult | null> {
  if (!env.FEDEX_TRACK_CLIENT_ID || !env.FEDEX_TRACK_CLIENT_SECRET) {
    logger.warn('GeneralTrackingApi: FedEx credentials not configured');
    return null;
  }
  const token = await getFedexAccessToken();
  const upstream = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-locale': 'en_US',
    },
    body: JSON.stringify({
      trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      includeDetailedScans: true,
    }),
  });
  const data = (await upstream.json().catch(() => ({}))) as any;
  const trackResult = data?.output?.completeTrackResults?.[0]?.trackResults?.[0];
  if (!upstream.ok || !trackResult || trackResult.error) return null;

  const scans: Array<Record<string, any>> = Array.isArray(trackResult.scanEvents) ? trackResult.scanEvents : [];
  const latest = scans[0] ?? {};
  const fmtLoc = (loc: any): string =>
    loc ? [loc.city, loc.stateOrProvinceCode, loc.countryCode].filter(Boolean).join(', ') : '';

  // FedEx exposes labelled milestones; the SHIP / pickup entry is the creation date.
  const dates: Array<Record<string, any>> = Array.isArray(trackResult.dateAndTimes) ? trackResult.dateAndTimes : [];
  const shipDate = dates.find((d) => d.type === 'SHIP' || d.type === 'ACTUAL_PICKUP' || d.type === 'ACTUAL_TENDER');
  const creationDate = shipDate?.dateTime
    ? clean(shipDate.dateTime)
    : scans.length > 0
      ? clean(scans[scans.length - 1]?.date)
      : NOT_AVAILABLE;

  // The most useful "next action" — FedEx spells it out under ancillaryDetails.
  const ancillary: Array<Record<string, any>> = Array.isArray(trackResult.latestStatusDetail?.ancillaryDetails)
    ? trackResult.latestStatusDetail.ancillaryDetails
    : [];
  const spelledOut = ancillary
    .map((d) => [d.actionDescription || d.reasonDescription, d.action].filter(Boolean).join(' — '))
    .filter(Boolean)
    .join('; ');

  const delivered = trackResult.latestStatusDetail?.code === 'DL'
    || looksDelivered(latest.eventDescription, trackResult.latestStatusDetail?.description);

  return {
    trackingNumber,
    found: true,
    source: 'FedEx',
    lastStatus: clean(latest.eventDescription || trackResult.latestStatusDetail?.description),
    lastStatusDate: clean(latest.date),
    creationDate,
    lastStatusLocation: clean(fmtLoc(latest.scanLocation)),
    requiredAction: delivered
      ? NOT_AVAILABLE
      : spelledOut || requiredActionFrom(latest.eventDescription, trackResult.latestStatusDetail?.description),
  };
}

// ── Jordan Passport (n8n webhook) ──────────────────────────────────────────

// n8n.wassel.ps serves only the leaf cert, so Node's TLS stack rejects the chain
// (UNABLE_TO_VERIFY_LEAF_SIGNATURE). Relaxed for this one internal host only —
// same interim workaround as /api/jopassport/track in app.ts.
function fetchJoPassport(joNumber: string, timeoutMs = 15_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://n8n.wassel.ps/webhook/2698a590-084f-43a6-a356-9c950a564609?JoNumber=${encodeURIComponent(joNumber)}`,
      { method: 'GET', headers: { Accept: 'application/json' }, timeout: timeoutMs, rejectUnauthorized: false },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          try { resolve(raw ? JSON.parse(raw) : null); } catch { resolve(null); }
        });
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error('Passport upstream request timed out')));
    req.on('error', reject);
    req.end();
  });
}

async function trackPassport(trackingNumber: string): Promise<GeneralTrackingResult | null> {
  const body = await fetchJoPassport(trackingNumber.toUpperCase());
  const record = body && typeof body === 'object' && Object.keys(body as object).length > 0
    ? (body as Record<string, any>)
    : null;
  if (!record) return null;

  const events: Array<Record<string, any>> = Array.isArray(record.events) ? record.events : [];
  const sorted = [...events].sort((a, b) => parseTime(b?.delevn_date ?? '') - parseTime(a?.delevn_date ?? ''));
  const latest = sorted[0] ?? {};
  const earliest = sorted.length > 0 ? sorted[sorted.length - 1] : {};

  const status = latest.status_front_en || latest.status || '';
  return {
    trackingNumber,
    found: true,
    source: 'JOPASSPORT',
    lastStatus: clean(status),
    lastStatusDate: clean(latest.delevn_date),
    creationDate: clean(record.created_date || (sorted.length > 0 ? earliest.delevn_date : '')),
    lastStatusLocation: clean(latest.location_en || latest.location || record.location_en || record.location),
    requiredAction: looksDelivered(status) ? NOT_AVAILABLE : requiredActionFrom(status),
  };
}

// ── Public entrypoint ──────────────────────────────────────────────────────

const RUNNERS: Record<Carrier, (n: string) => Promise<GeneralTrackingResult | null>> = {
  wassel: trackWassel,
  dhl: trackDhl,
  fedex: trackFedex,
  passport: trackPassport,
};

/**
 * Detect the carrier, query it, and return the normalized summary. Never throws:
 * any miss, upstream error or unrecognized number yields an all-"Not available"
 * result with `found: false`.
 */
export async function getGeneralTracking(rawNumber: string): Promise<GeneralTrackingResult> {
  const trackingNumber = rawNumber.trim();
  if (!trackingNumber) return emptyResult(trackingNumber);

  const carrier = detectCarrier(trackingNumber);
  try {
    const result = await RUNNERS[carrier](trackingNumber);
    return result ?? emptyResult(trackingNumber);
  } catch (err) {
    logger.error(`GeneralTrackingApi: ${carrier} lookup failed for ${trackingNumber}:`, err);
    return emptyResult(trackingNumber);
  }
}
