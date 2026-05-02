import { Request, Response, NextFunction } from 'express';
import * as chatService from '../services/chat.service';
import { StartChatRequest, SendMessageRequest, CloseSessionRequest } from '../types/chat.types';
import { env } from '../config/env';

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
 * GET /api/chat/debug/respondio
 * Fires a test message at the respond.io Custom Channel webhook and
 * returns the raw HTTP status + body so you can diagnose forwarding issues
 * without reading Railway logs.
 */
export async function debugRespondIo(_req: Request, res: Response): Promise<void> {
  const channelId  = env.RESPOND_CHANNEL_ID;
  const apiToken   = env.RESPOND_API_TOKEN;
  // Full URL = base RESPOND_WEBHOOK_URL + '/' + RESPOND_CHANNEL_ID
  const webhookUrl = env.RESPOND_WEBHOOK_URL.replace(/\/$/, '') + '/' + channelId;

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
