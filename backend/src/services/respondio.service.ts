import { env } from '../config/env';
import { ChatSession } from '../types/chat.types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface SendParams {
  session: ChatSession;
  messageId: string;
  messageText: string;
}

interface SendResult {
  success: boolean;
  respondBody?: string;
  error?: string;
}

async function sendIncomingMessageToRespondIo(params: SendParams): Promise<SendResult> {
  const { session, messageId, messageText } = params;

  // Build contact object — omit null/undefined fields
  const contact: Record<string, string> = {
    firstName:   session.firstName ?? 'Visitor',
    countryCode: 'PS',
    phone:       session.phone,
    language:    session.language ?? 'ar',
  };
  if (session.lastName) contact.lastName   = session.lastName;
  if (session.email)    contact.email      = session.email;

  const payload = {
    channelId: env.RESPOND_CHANNEL_ID,
    contactId: session.contactId,
    events: [
      {
        type:      'message',
        // respond.io expects a plain UUID for mId (no prefix)
        mId:       uuidv4(),
        timestamp: Date.now(),
        message: {
          type: 'text',
          text: messageText,
        },
      },
    ],
    contact,
  };

  try {
    const webhookUrl = env.RESPOND_WEBHOOK_URL.replace(/\/$/, '') + '/';
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${env.RESPOND_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const respondBody = await response.text().catch(() => '');

    if (!response.ok) {
      logger.error(`respond.io returned ${response.status}: ${respondBody}`);
      return { success: false, error: `respond.io ${response.status}: ${respondBody}` };
    }

    logger.info(`Message ${messageId} forwarded to respond.io. Response: ${respondBody}`);
    return { success: true, respondBody };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to reach respond.io: ${message}`);
    return { success: false, error: message };
  }
}

export const respondioService = { sendIncomingMessageToRespondIo };
