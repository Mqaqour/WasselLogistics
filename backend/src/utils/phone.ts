/**
 * Normalize a phone number to E.164 format.
 * Defaults to Palestine (+970) when local format is detected.
 *
 * Examples:
 *   0599987812       → +970599987812
 *   970599987812     → +970599987812
 *   +970599987812    → +970599987812
 */
export function normalizePhoneNumber(raw: string): string {
  let phone = raw.trim().replace(/[\s\-().]/g, '');

  if (phone.startsWith('+')) {
    return phone;
  }

  if (phone.startsWith('970')) {
    return `+${phone}`;
  }

  if (phone.startsWith('0')) {
    return `+970${phone.slice(1)}`;
  }

  // Unknown format — return as-is with + prefix
  return `+${phone}`;
}

export function isValidContactId(contactId: string): boolean {
  return contactId.length <= 50;
}
