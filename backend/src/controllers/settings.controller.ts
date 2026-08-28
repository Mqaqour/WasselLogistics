import { Request, Response, NextFunction } from 'express';
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettings,
  CONTACT_TOPIC_IDS,
} from '../services/settings.service';

const EMAIL_LIST_RE = /^[^\s,]+@[^\s,]+\.[^\s,]+(,\s*[^\s,]+@[^\s,]+\.[^\s,]+)*$/;

function isValidEmailList(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && EMAIL_LIST_RE.test(value.trim());
}

export async function getNotifications(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await getNotificationSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

export async function updateNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = (req.body ?? {}) as Partial<NotificationSettings>;
    const fields: Array<'pickupNotifyEmail' | 'contactNotifyEmail' | 'loginAlertEmails'> = [
      'pickupNotifyEmail',
      'contactNotifyEmail',
      'loginAlertEmails',
    ];

    for (const field of fields) {
      if (body[field] !== undefined && !isValidEmailList(body[field])) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `${field} must be one or more comma-separated email addresses.` },
        });
        return;
      }
    }

    // businessAccountEmail may be empty (falls back to the contact inbox) or a valid email list.
    if (
      body.businessAccountEmail !== undefined &&
      (typeof body.businessAccountEmail !== 'string' ||
        (body.businessAccountEmail.trim().length > 0 && !isValidEmailList(body.businessAccountEmail)))
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'businessAccountEmail must be empty or one or more comma-separated email addresses.',
        },
      });
      return;
    }

    if (body.contactTopicEmails !== undefined) {
      const map = body.contactTopicEmails;
      if (typeof map !== 'object' || map === null || Array.isArray(map)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'contactTopicEmails must be an object.' },
        });
        return;
      }
      for (const id of CONTACT_TOPIC_IDS) {
        const value = (map as Record<string, unknown>)[id];
        if (value === undefined) continue;
        // Empty string is allowed — it means "use the default contact inbox".
        if (typeof value !== 'string' || (value.trim().length > 0 && !isValidEmailList(value))) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `contactTopicEmails.${id} must be empty or one or more comma-separated email addresses.`,
            },
          });
          return;
        }
      }
    }

    const values: Partial<NotificationSettings> = {};
    for (const field of fields) {
      if (typeof body[field] === 'string') values[field] = (body[field] as string).trim();
    }
    if (typeof body.businessAccountEmail === 'string') {
      values.businessAccountEmail = body.businessAccountEmail.trim();
    }

    if (body.contactTopicEmails && typeof body.contactTopicEmails === 'object') {
      const topicEmails: Partial<NotificationSettings['contactTopicEmails']> = {};
      for (const id of CONTACT_TOPIC_IDS) {
        const value = (body.contactTopicEmails as Record<string, unknown>)[id];
        if (typeof value === 'string') topicEmails[id] = value.trim();
      }
      if (Object.keys(topicEmails).length > 0) {
        values.contactTopicEmails = topicEmails as NotificationSettings['contactTopicEmails'];
      }
    }

    const ok = await updateNotificationSettings(values, null);
    if (!ok) {
      res.status(503).json({ success: false, error: { code: 'SAVE_FAILED', message: 'Could not save settings.' } });
      return;
    }

    const settings = await getNotificationSettings();
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}
