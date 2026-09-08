import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import * as chatService from '../services/chat.service';
import { StartChatRequest, SendMessageRequest, CloseSessionRequest } from '../types/chat.types';
import { env } from '../config/env';
import {
  UPLOAD_DIR,
  attachmentTypeForMime,
  scheduleOrphanCleanup,
  sendChatAttachment,
} from '../utils/chatUploads';

const ATTACHMENT_FILENAME_RE = /^[a-f0-9-]{36}(\.[a-zA-Z0-9]{1,10})?$/;

export async function startChat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await chatService.startChat(req.body as StartChatRequest);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await chatService.sendMessage(req.body as SendMessageRequest);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sessionId } = req.params;
    const result = await chatService.getMessages(sessionId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function closeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await chatService.closeSession(req.body as CloseSessionRequest);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/upload
 *
 * Accepts a single multipart file (field name "file") and stores it briefly
 * so respond.io can fetch it by URL — see utils/chatUploads.ts for why this
 * is ephemeral rather than real file storage.
 */
export async function uploadAttachment(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded.' } });
    return;
  }

  scheduleOrphanCleanup(req.file.path);

  const url = `${req.protocol}://${req.get('host')}/api/chat/attachments/${req.file.filename}`;
  res.status(200).json({
    success: true,
    url,
    attachmentType: attachmentTypeForMime(req.file.mimetype),
    mimeType: req.file.mimetype,
    fileName: req.file.originalname,
  });
}

/**
 * GET /api/chat/attachments/:filename
 *
 * Serves an uploaded attachment — repeatably, since a single logical download can
 * involve more than one request (HEAD probe, Range chunks, a retry). The file is
 * cleaned up on a timer (scheduleOrphanCleanup), not after a single response.
 */
export function getAttachment(req: Request, res: Response): void {
  const { filename } = req.params;
  if (!ATTACHMENT_FILENAME_RE.test(filename)) {
    res.status(400).json({ error: { code: 'INVALID_FILENAME', message: 'Invalid attachment filename.' } });
    return;
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (path.dirname(filePath) !== UPLOAD_DIR || !fs.existsSync(filePath)) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Attachment not found or already expired.' } });
    return;
  }

  sendChatAttachment(res, filePath);
}

/**
 * GET /api/chat/debug/respondio
 * Fires a test message at the respond.io Custom Channel webhook and
 * returns the raw HTTP status + body so you can diagnose forwarding issues
 * without reading Railway logs.
 */
export async function debugRespondIo(_req: Request, res: Response): Promise<void> {
  const channelId  = env.RESPOND_CHANNEL_ID;
  const apiToken   = env.RESPOND_API_TOKEN;
  // channelId is in the JSON body — do NOT append it to the URL
  const webhookUrl = env.RESPOND_WEBHOOK_URL.replace(/\/$/, '') + '/';

  // Show config (mask token for security)
  const config = {
    channelId:  channelId  || '(not set)',
    apiToken:   apiToken   ? apiToken.slice(0, 8) + '…' : '(not set)',
    webhookUrl,
  };

  if (!channelId || !apiToken) {
    res.status(200).json({ ok: false, reason: 'Missing env vars', config });
    return;
  }

  const testPayload = {
    channelId,
    contactId: '+970000000000',
    events: [{
      type:      'message',
      mId:       'debug-test-' + Date.now(),
      timestamp: Date.now(),
      message:   { type: 'text', text: '[debug] respond.io connectivity test — ignore this message' },
    }],
    contact: { firstName: 'Debug', lastName: 'Test', countryCode: 'PS', phone: '+970000000000', language: 'en' },
  };

  try {
    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiToken}` },
      body:    JSON.stringify(testPayload),
    });
    const body = await response.text().catch(() => '');
    res.status(200).json({ ok: response.ok, httpStatus: response.status, body, config });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(200).json({ ok: false, error: message, config });
  }
}
