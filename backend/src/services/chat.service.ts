import * as repo from '../repositories/chat.repository';
import { respondioService } from './respondio.service';
import {
  StartChatRequest, StartChatResponse,
  SendMessageRequest, SendMessageResponse,
  GetMessagesResponse,
  CloseSessionRequest,
  ChatSession,
} from '../types/chat.types';
import { normalizePhoneNumber, isValidContactId } from '../utils/phone';
import { generateSessionId, generateMessageId } from '../utils/ids';
import { logger } from '../utils/logger';

// ── Start Chat ────────────────────────────────────────────────────────────────

export async function startChat(body: StartChatRequest): Promise<StartChatResponse> {
  const phone = normalizePhoneNumber(body.phone);
  const contactId = phone;

  if (!isValidContactId(contactId)) {
    throw Object.assign(new Error('Phone number is too long (max 50 chars after normalisation).'), { code: 'VALIDATION_ERROR', status: 400 });
  }

  // Return existing open session if one exists
  const existing = await repo.findOpenSessionByPhone(phone);
  if (existing) {
    return { success: true, sessionId: existing.sessionId, contactId: existing.contactId };
  }

  const sessionId = generateSessionId();
  const session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt' | 'closedAt'> = {
    sessionId,
    contactId,
    phone,
    firstName:          body.firstName,
    lastName:           body.lastName ?? null,
    email:              body.email ?? null,
    serviceType:        body.serviceType,
    trackingNumber:     body.trackingNumber ?? null,
    language:           body.language ?? 'ar',
    status:             'open',
    assignedDepartment: null,
  };

  await repo.createSession(session);
  logger.info(`New chat session created: ${sessionId} for contact: ${contactId}`);

  return { success: true, sessionId, contactId };
}

// ── Send Message ──────────────────────────────────────────────────────────────

export async function sendMessage(body: SendMessageRequest): Promise<SendMessageResponse> {
  const session = await repo.findSessionById(body.sessionId);
  if (!session) {
    throw Object.assign(new Error('Session not found.'), { code: 'SESSION_NOT_FOUND', status: 404 });
  }

  const messageId = generateMessageId('web');

  await repo.saveMessage({
    sessionId:        session.sessionId,
    contactId:        session.contactId,
    messageId,
    respondMessageId: null,
    senderType:       'visitor',
    messageType:      'text',
    messageText:      body.message,
    attachmentUrl:    null,
    status:           'sent',
    rawPayload:       null,
  });

  const sent = await respondioService.sendIncomingMessageToRespondIo({
    session,
    messageId,
    messageText: body.message,
  });

  if (!sent.success) {
    await repo.saveEvent({
      sessionId: session.sessionId,
      contactId: session.contactId,
      eventType: 'respondio_send_failed',
      rawPayload: JSON.stringify({ messageId, error: sent.error }),
    });
    throw Object.assign(new Error('Failed to forward message to respond.io.'), { code: 'UPSTREAM_ERROR', status: 502 });
  }

  return { success: true, messageId };
}

// ── Get Messages ──────────────────────────────────────────────────────────────

export async function getMessages(sessionId: string): Promise<GetMessagesResponse> {
  const session = await repo.findSessionById(sessionId);
  if (!session) {
    throw Object.assign(new Error('Session not found.'), { code: 'SESSION_NOT_FOUND', status: 404 });
  }

  const messages = await repo.getMessagesBySession(sessionId);
  return { success: true, messages };
}

// ── Close Session ─────────────────────────────────────────────────────────────

export async function closeSession(body: CloseSessionRequest): Promise<void> {
  const session = await repo.findSessionById(body.sessionId);
  if (!session) {
    throw Object.assign(new Error('Session not found.'), { code: 'SESSION_NOT_FOUND', status: 404 });
  }
  await repo.closeSession(body.sessionId);
  logger.info(`Chat session closed: ${body.sessionId}`);
}
