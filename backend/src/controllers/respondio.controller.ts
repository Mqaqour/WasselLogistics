import { Request, Response, NextFunction } from 'express';
import * as repo from '../repositories/chat.repository';
import { emitAgentMessage } from '../services/socket.service';
import { generateMessageId, generateSessionId } from '../utils/ids';
import { normalizePhoneNumber } from '../utils/phone';
import { env } from '../config/env';
import { RespondIoIncomingPayload } from '../types/chat.types';
import { logger } from '../utils/logger';

export async function receiveAgentMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as RespondIoIncomingPayload;

    // Save raw payload for audit
    await repo.saveEvent({
      sessionId:  null,
      contactId:  body.contactId ?? null,
      eventType:  'respondio_incoming',
      rawPayload: JSON.stringify(body),
    });

    // Validate channelId
    if (body.channelId !== env.RESPOND_CHANNEL_ID) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CHANNEL', message: 'Channel ID does not match.' },
      });
      return;
    }

    const contactId = normalizePhoneNumber(body.contactId);

    // Find open session
    let session = await repo.findOpenSessionByContactId(contactId);

    if (!session) {
      // Auto-create a session when the agent initiates
      const sessionId = generateSessionId();
      session = await repo.createSession({
        sessionId,
        contactId,
        phone:              contactId,
        firstName:          null,
        lastName:           null,
        email:              null,
        serviceType:        null,
        trackingNumber:     null,
        language:           'ar',
        status:             'open',
        assignedDepartment: null,
      });
      logger.info(`Auto-created session ${sessionId} for incoming agent message on contact ${contactId}`);
    }

    const messageId = generateMessageId('agent');
    const messageText = body.message?.type === 'text' ? (body.message.text ?? null) : null;

    await repo.saveMessage({
      sessionId:        session.sessionId,
      contactId:        session.contactId,
      messageId,
      respondMessageId: null,
      senderType:       'agent',
      messageType:      body.message?.type ?? 'text',
      messageText,
      attachmentUrl:    null,
      // TODO: handle attachment, location, quick_reply
      status:           'delivered',
      rawPayload:       JSON.stringify(body),
    });

    emitAgentMessage(session.sessionId, {
      messageId,
      senderType:  'agent',
      messageType: body.message?.type ?? 'text',
      messageText,
      createdAt:   new Date().toISOString(),
    });

    // respond.io requires { mId } in the response
    res.status(200).json({ mId: messageId });
  } catch (err) {
    next(err);
  }
}
