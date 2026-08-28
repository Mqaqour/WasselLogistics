// Access to Wassel's internal AWB-details API. Credentials come from the
// environment (WASSEL_AWB_USERNAME / WASSEL_AWB_PASSWORD) — never hard-coded.
import { env } from '../config/env';

export function wasselAwbDetailsUrl(awbs: string): string {
  return `${env.WASSEL_AWB_BASE_URL}/api/GetAwbDetails?Awbs=${encodeURIComponent(awbs)}`;
}

export function wasselAwbHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (env.WASSEL_AWB_USERNAME || env.WASSEL_AWB_PASSWORD) {
    const basic = Buffer.from(`${env.WASSEL_AWB_USERNAME}:${env.WASSEL_AWB_PASSWORD}`).toString('base64');
    headers.Authorization = `Basic ${basic}`;
  }
  return headers;
}
