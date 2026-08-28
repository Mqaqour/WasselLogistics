// ─────────────────────────────────────────────────────────────────────────────
// System Settings — admin-editable runtime config, stored in the DB with the
// .env value as the fallback default when a setting has never been saved.
// ─────────────────────────────────────────────────────────────────────────────
import { env } from '../config/env';
import { getSettings, upsertSetting } from '../repositories/settings.repository';

// Contact-form inquiry types. Kept in sync with the topic ids on the public
// Contact form (components/pages/StaticPages.tsx) and CONTACT_TOPIC_LABELS in app.ts.
export const CONTACT_TOPIC_IDS = ['general', 'shipment', 'passport', 'complaint', 'claiming'] as const;
export type ContactTopicId = (typeof CONTACT_TOPIC_IDS)[number];

export interface NotificationSettings {
  pickupNotifyEmail: string;
  contactNotifyEmail: string;
  loginAlertEmails: string;
  /** Commercial department inbox(es) for "Open Account" business-account requests
   *  (comma-separated allowed). Empty string = fall back to contactNotifyEmail. */
  businessAccountEmail: string;
  /** Per-topic override inbox for the Contact form. Empty string = fall back to contactNotifyEmail. */
  contactTopicEmails: Record<ContactTopicId, string>;
}

type ScalarNotificationKey =
  | 'pickupNotifyEmail'
  | 'contactNotifyEmail'
  | 'loginAlertEmails'
  | 'businessAccountEmail';

const NOTIFICATION_KEYS: ScalarNotificationKey[] = [
  'pickupNotifyEmail',
  'contactNotifyEmail',
  'loginAlertEmails',
  'businessAccountEmail',
];

const contactTopicSettingKey = (topic: string): string => `contactTopicEmail_${topic}`;

function notificationDefaults(): Record<ScalarNotificationKey, string> {
  return {
    pickupNotifyEmail: env.PICKUP_NOTIFY_EMAIL,
    contactNotifyEmail: env.CONTACT_NOTIFY_EMAIL,
    loginAlertEmails: env.LOGIN_ALERT_EMAILS,
    // No dedicated env default — an unset value falls back to the contact inbox at resolve time.
    businessAccountEmail: '',
  };
}

function emptyContactTopicEmails(): Record<ContactTopicId, string> {
  const map = {} as Record<ContactTopicId, string>;
  for (const id of CONTACT_TOPIC_IDS) map[id] = '';
  return map;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const topicKeys = CONTACT_TOPIC_IDS.map(contactTopicSettingKey);
  const stored = await getSettings([...NOTIFICATION_KEYS, ...topicKeys]);
  const defaults = notificationDefaults();

  const contactTopicEmails = emptyContactTopicEmails();
  for (const id of CONTACT_TOPIC_IDS) {
    contactTopicEmails[id] = stored[contactTopicSettingKey(id)] ?? '';
  }

  return {
    pickupNotifyEmail: stored.pickupNotifyEmail ?? defaults.pickupNotifyEmail,
    contactNotifyEmail: stored.contactNotifyEmail ?? defaults.contactNotifyEmail,
    loginAlertEmails: stored.loginAlertEmails ?? defaults.loginAlertEmails,
    businessAccountEmail: stored.businessAccountEmail ?? defaults.businessAccountEmail,
    contactTopicEmails,
  };
}

export async function updateNotificationSettings(
  values: Partial<NotificationSettings>,
  updatedBy: string | null
): Promise<boolean> {
  const entries: Array<readonly [string, string]> = [];

  for (const key of NOTIFICATION_KEYS) {
    if (typeof values[key] === 'string') entries.push([key, (values[key] as string).trim()]);
  }

  if (values.contactTopicEmails && typeof values.contactTopicEmails === 'object') {
    for (const id of CONTACT_TOPIC_IDS) {
      const value = values.contactTopicEmails[id];
      // An empty string is a valid value here — it clears the override so the
      // topic falls back to contactNotifyEmail.
      if (typeof value === 'string') entries.push([contactTopicSettingKey(id), value.trim()]);
    }
  }

  if (entries.length === 0) return false;

  const results = await Promise.all(
    entries.map(([key, value]) => upsertSetting(key, value, updatedBy))
  );
  return results.every(Boolean);
}

/**
 * The inbox a Contact-form submission for `topic` should be emailed to: the
 * per-topic override when one is set, otherwise the default contact inbox.
 */
export async function resolveContactRecipient(topic: string): Promise<string> {
  const settings = await getNotificationSettings();
  const override = (settings.contactTopicEmails as Record<string, string>)[topic];
  return override && override.trim().length > 0 ? override.trim() : settings.contactNotifyEmail;
}

/** The commercial-department inbox(es) a business-account ("Open Account") request
 *  should be emailed to, falling back to the default contact inbox. */
export async function resolveBusinessAccountRecipient(): Promise<string> {
  const settings = await getNotificationSettings();
  return settings.businessAccountEmail.trim().length > 0
    ? settings.businessAccountEmail.trim()
    : settings.contactNotifyEmail;
}
