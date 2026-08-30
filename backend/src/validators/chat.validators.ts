import { z } from 'zod';

export const startChatSchema = z.object({
  firstName:      z.string().min(1, 'First name is required').max(100),
  lastName:       z.string().max(100).optional(),
  phone:          z.string().min(7, 'Phone number is required').max(30),
  // The frontend sends "" (not undefined) for a blank optional field, which
  // .email().optional() would still reject — treat empty/blank string as absent.
  email:          z.preprocess(
                    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
                    z.string().email('Invalid email address').max(150).optional()
                  ),
  serviceType:    z.string().min(1, 'Service type is required').max(100),
  trackingNumber: z.string().max(100).optional(),
  language:       z.enum(['ar', 'en']).default('ar'),
});

const sendMessageAttachmentSchema = z.object({
  url:            z.string().url('Invalid attachment URL'),
  attachmentType: z.enum(['image', 'video', 'audio', 'file']),
  mimeType:       z.string().min(1).max(255),
  fileName:       z.string().min(1).max(255),
});

export const sendMessageSchema = z.object({
  sessionId:  z.string().uuid('Invalid session ID'),
  message:    z.string().max(7000, 'Message exceeds 7000 character limit').optional(),
  attachment: sendMessageAttachmentSchema.optional(),
}).refine((data) => (data.message && data.message.trim().length > 0) || !!data.attachment, {
  message: 'Message or attachment is required',
});

export const closeSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export const respondioMessageSchema = z.object({
  channelId: z.string().optional(),
  contactId: z.string().min(1, 'contactId is required'),
  message: z.object({
    type: z.enum(['text', 'attachment', 'location', 'quick_reply']),
    text: z.string().optional(),
  }),
});
