import { env } from '../config/env';
import { RespondIoOutgoingPayload } from '../types/chat.types';
import { ChatSession } from '../types/chat.types';
import { logger } from '../utils/logger';

interface SendParams {
  session: ChatSession;
  messageId: string;
  messageText: string;
}

interface SendResult {
  success: boolean;
  error?: string;
}

async function sendIncomingMessageToRespondIo(params: SendParams): Promise<SendResult> {
  const { session, messageId, messageText } = params;

  const payload: RespondIoOutgoingPayload = {
    channelId: env.RESPOND_CHANNEL_ID,
    contactId: session.contactId,
    events: [
      {
        type:      'message',
        mId:       messageId,
        timestamp: Date.now(),
        message: {
          type: 'text',
          text: messageText,
        },
      },
    ],
    contact: {
      firstName:   session.firstName,
      lastName:    session.lastName,
      countryCode: 'PS',
      email:       session.email,
      phone:       session.phone,
      language:    session.language,
    },
  };

  try {
    // RESPOND_WEBHOOK_URL must be the full incoming webhook URL provided by respond.io
    // (e.g. https://app.respond.io/custom/channel/webhook/<token>)
    const webhookUrl = env.RESPOND_WEBHOOK_URL.replace(/\/$/, '');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${env.RESPOND_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logger.error(`respond.io returned ${response.status}: ${body}`);
      return { success: false, error: `respond.io ${response.status}: ${body}` };
    }

    logger.debug(`Message ${messageId} forwarded to respond.io successfully.`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to reach respond.io: ${message}`);
    return { success: false, error: message };
  }
}

export const respondioService = { sendIncomingMessageToRespondIo };
