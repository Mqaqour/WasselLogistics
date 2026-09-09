// ─────────────────────────────────────────────────────────────────────────────
// WasselCustoms public customs-case lookup.
//
// Supplements shipment tracking: given an AWB, ask the WasselCustoms API whether
// there is an open customs clearance case and, if so, what the customer still
// needs to provide. Server-to-server only — the shared x-api-key never reaches
// the browser (proxied by /api/customs-case).
//
// Never throws. Any miss, timeout, non-2xx, malformed body or missing key yields
// `{ hasOpenCase: false, cases: [] }` so the tracking page can treat it as
// "no customs case" and render nothing extra.
//
// Contract mirror — keep in sync with WasselCustoms/packages/shared/src/tracking.ts
// (PublicTrackingView). See also services/generalTracking.service.ts for the
// same never-throw + TTL-cache shape.
// ─────────────────────────────────────────────────────────────────────────────
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface CustomsRequirementView {
  type: string;
  title: string;
  status: string;
  outstanding: boolean;
}

export interface CustomsStatusEventView {
  ts: string;
  statusLabel: string;
}

export interface CustomsCaseEntry {
  caseNumber: string;
  status: string;
  statusLabel: string;
  receivedAt: string;
  lastActivityAt: string;
  requirements: CustomsRequirementView[];
  statusHistory: CustomsStatusEventView[];
}

export interface CustomsCaseView {
  awbMasked?: string;
  hasOpenCase: boolean;
  cases: CustomsCaseEntry[];
}

const EMPTY: CustomsCaseView = { hasOpenCase: false, cases: [] };

const CACHE_TTL_MS = 60 * 1000; // 60s, positive and negative
const UPSTREAM_TIMEOUT_MS = 3000;

const cache = new Map<string, { at: number; value: CustomsCaseView }>();

/** one of fedex|dhl|aramex|other — advisory only upstream; anything else is dropped. */
const CUSTOMS_CARRIERS = new Set(['fedex', 'dhl', 'aramex', 'other']);

function normalizeCarrier(carrier?: string): string | undefined {
  const c = (carrier ?? '').trim().toLowerCase();
  return CUSTOMS_CARRIERS.has(c) ? c : undefined;
}

/** Coerce an unknown upstream body into our shape; return null if it isn't trustworthy. */
function coerce(data: unknown): CustomsCaseView | null {
  if (!data || typeof data !== 'object') return null;
  const body = data as Record<string, unknown>;
  if (typeof body.hasOpenCase !== 'boolean') return null;

  const rawCases = Array.isArray(body.cases) ? body.cases : [];
  const cases: CustomsCaseEntry[] = rawCases.slice(0, 5).map((c) => {
    const entry = (c ?? {}) as Record<string, unknown>;
    const reqs = Array.isArray(entry.requirements) ? entry.requirements : [];
    const hist = Array.isArray(entry.statusHistory) ? entry.statusHistory : [];
    return {
      caseNumber: String(entry.caseNumber ?? ''),
      status: String(entry.status ?? ''),
      statusLabel: String(entry.statusLabel ?? ''),
      receivedAt: String(entry.receivedAt ?? ''),
      lastActivityAt: String(entry.lastActivityAt ?? ''),
      requirements: reqs.map((r) => {
        const req = (r ?? {}) as Record<string, unknown>;
        return {
          type: String(req.type ?? 'other'),
          title: String(req.title ?? ''),
          status: String(req.status ?? ''),
          outstanding: req.outstanding === true,
        };
      }),
      statusHistory: hist.map((h) => {
        const ev = (h ?? {}) as Record<string, unknown>;
        return { ts: String(ev.ts ?? ''), statusLabel: String(ev.statusLabel ?? '') };
      }),
    };
  });

  return {
    awbMasked: typeof body.awbMasked === 'string' ? body.awbMasked : undefined,
    hasOpenCase: body.hasOpenCase,
    cases: body.hasOpenCase ? cases : [],
  };
}

/**
 * Look up the customs case for an AWB. Always resolves — see the file header for
 * the "no data" contract. `carrier` is advisory (logging) upstream.
 */
export async function getCustomsCase(rawAwb: string, carrier?: string): Promise<CustomsCaseView> {
  const awb = rawAwb.trim();
  if (!awb) return EMPTY;
  if (!env.CUSTOMS_API_KEY) return EMPTY;

  const normCarrier = normalizeCarrier(carrier);
  const key = `${awb}|${normCarrier ?? ''}`;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const result = await fetchCustomsCase(awb, normCarrier);
  cache.set(key, { at: Date.now(), value: result });
  return result;
}

async function fetchCustomsCase(awb: string, carrier?: string): Promise<CustomsCaseView> {
  const url = new URL('/api/v1/public/tracking', env.CUSTOMS_API_BASE_URL);
  url.searchParams.set('awb', awb);
  if (carrier) url.searchParams.set('carrier', carrier);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'x-api-key': env.CUSTOMS_API_KEY, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return EMPTY;
    const data = await res.json().catch(() => null);
    return coerce(data) ?? EMPTY;
  } catch (err) {
    logger.warn(`customs-case: lookup failed for ${awb}: ${err instanceof Error ? err.message : String(err)}`);
    return EMPTY;
  } finally {
    clearTimeout(timer);
  }
}
