import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.RESPONDIO_BRIDGE_PORT || 8787);
const API_TOKEN = process.env.RESPONDIO_API_TOKEN || '';
const CHANNEL_ID = process.env.RESPONDIO_CHANNEL_ID || '';
const INCOMING_WEBHOOK_URL = process.env.RESPONDIO_INCOMING_WEBHOOK_URL || 'https://app.respond.io/custom/channel/webhook/';
const CUSTOM_CHAT_OUTGOING_WEBHOOK_URL = process.env.CUSTOM_CHAT_OUTGOING_WEBHOOK_URL || '';

const json = (response, statusCode, payload) => {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
};

const text = (response, statusCode, payload) => {
  response.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(payload);
};

const getBearerToken = (request) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice('Bearer '.length).trim();
};

const validateBearerToken = (request, response) => {
  if (!API_TOKEN) {
    json(response, 500, { error: 'RESPONDIO_API_TOKEN is not configured.' });
    return false;
  }

  if (getBearerToken(request) !== API_TOKEN) {
    json(response, 401, { error: 'Unauthorized.' });
    return false;
  }

  return true;
};

const readJsonBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const buildIncomingEventPayload = (body) => {
  const channelId = body.channelId || CHANNEL_ID;
  const contactId = body.contactId;
  const messageText = body.text;

  if (!channelId) {
    throw new Error('Missing channelId. Set RESPONDIO_CHANNEL_ID or include channelId in the request body.');
  }

  if (!contactId) {
    throw new Error('Missing contactId.');
  }

  if (!messageText) {
    throw new Error('Missing text.');
  }

  return {
    channelId,
    contactId,
    events: [
      {
        type: 'message',
        mId: body.mId || randomUUID(),
        timestamp: body.timestamp || Date.now(),
        message: {
          type: 'text',
          text: messageText,
        },
      },
    ],
    ...(body.contact ? { contact: body.contact } : {}),
  };
};

const handleHealthcheck = (response) => {
  json(response, 200, {
    ok: true,
    port: PORT,
    hasApiToken: Boolean(API_TOKEN),
    hasChannelId: Boolean(CHANNEL_ID),
    hasIncomingWebhookUrl: Boolean(INCOMING_WEBHOOK_URL),
    hasOutgoingForwardUrl: Boolean(CUSTOM_CHAT_OUTGOING_WEBHOOK_URL),
  });
};

const handleOutgoingMessage = async (request, response) => {
  if (!validateBearerToken(request, response)) {
    return;
  }

  const body = await readJsonBody(request);

  if (!body?.contactId || !body?.message?.type) {
    json(response, 400, { error: 'Invalid outgoing message payload.' });
    return;
  }

  const generatedMessageId = randomUUID();

  if (!CUSTOM_CHAT_OUTGOING_WEBHOOK_URL) {
    json(response, 200, {
      mId: generatedMessageId,
      delivered: false,
      note: 'Message accepted. Set CUSTOM_CHAT_OUTGOING_WEBHOOK_URL to forward it to your chat transport.',
    });
    return;
  }

  const forwardResponse = await fetch(CUSTOM_CHAT_OUTGOING_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: request.headers.authorization || '',
    },
    body: JSON.stringify({
      ...body,
      mId: generatedMessageId,
      receivedAt: new Date().toISOString(),
    }),
  });

  if (!forwardResponse.ok) {
    const errorText = await forwardResponse.text();
    json(response, 502, {
      error: 'Failed to forward outgoing respond.io message.',
      details: errorText || `Upstream status ${forwardResponse.status}`,
    });
    return;
  }

  json(response, 200, { mId: generatedMessageId });
};

const handleIncomingMessage = async (request, response) => {
  if (!validateBearerToken(request, response)) {
    return;
  }

  const body = await readJsonBody(request);
  const payload = buildIncomingEventPayload(body);

  const webhookResponse = await fetch(INCOMING_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!webhookResponse.ok) {
    const errorText = await webhookResponse.text();
    json(response, 502, {
      error: 'respond.io incoming webhook rejected the message.',
      details: errorText || `Upstream status ${webhookResponse.status}`,
    });
    return;
  }

  text(response, 200, 'OK');
};

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/health') {
      handleHealthcheck(response);
      return;
    }

    if (request.method === 'POST' && request.url === '/message') {
      await handleOutgoingMessage(request, response);
      return;
    }

    if (request.method === 'POST' && request.url === '/webhooks/respondio/incoming') {
      await handleIncomingMessage(request, response);
      return;
    }

    json(response, 404, { error: 'Not found.' });
  } catch (error) {
    json(response, 500, {
      error: 'Unexpected server error.',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

server.listen(PORT, () => {
  console.log(`respond.io webhook bridge listening on http://localhost:${PORT}`);
});
