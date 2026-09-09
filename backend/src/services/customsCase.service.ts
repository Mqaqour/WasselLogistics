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
import http from 'http';
import https from 'https';
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
  // Feature is off / misconfigured — fail silent (a blank base URL would otherwise
  // throw in `new URL()` on every lookup).
  if (!env.CUSTOMS_API_KEY || !env.CUSTOMS_API_BASE_URL) return EMPTY;

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

  try {
    const { status, body } = await httpGetJson(url);
    if (status < 200 || status >= 300) return EMPTY;
    return coerce(body) ?? EMPTY;
  } catch (err) {
    logger.warn(`customs-case: lookup failed for ${awb}: ${err instanceof Error ? err.message : String(err)}`);
    return EMPTY;
  }
}

/**
 * Plain GET returning `{ status, body }` (body = parsed JSON or null). Uses the
 * node http/https modules rather than fetch so that, like the n8n proxy in
 * app.ts (fetchJoPassportTracking), TLS verification can be relaxed for the
 * WasselCustoms host only.
 *
 * INTERIM: `wasselwebuat.wassel.ps` currently serves an expired certificate,
 * which Node's TLS stack rejects (fetch would throw before any response). The
 * relaxation is scoped to *.wassel.ps HTTPS hosts and to this one request path;
 * remove it once WasselCustoms renews the certificate.
 */
function httpGetJson(url: URL): Promise<{ status: number; body: unknown }> {
  const isHttps = url.protocol === 'https:';
  const relaxTls = isHttps && /(^|\.)wassel\.ps$/i.test(url.hostname);
  const client = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method: 'GET',
        headers: { 'x-api-key': env.CUSTOMS_API_KEY, Accept: 'application/json' },
        timeout: UPSTREAM_TIMEOUT_MS,
        ...(relaxTls ? { rejectUnauthorized: false } : {}),
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let body: unknown = null;
          try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
          resolve({ status: res.statusCode ?? 502, body });
        });
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error('customs upstream request timed out')));
    req.on('error', reject);
    req.end();
  });
}
