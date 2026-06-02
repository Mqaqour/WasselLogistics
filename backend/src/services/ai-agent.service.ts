import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';
import { env } from '../config/env';

type ResourceSearchResult = {
  answer: string;
  relatedTopics: string[];
};

type TrackingApiLog = {
  portalDescription?: string;
  portalDescriptionAr?: string;
  statusDate?: string;
  statusTime?: string;
  location?: string;
};

type TrackingApiItem = {
  status?: string;
  statusAr?: string;
  from?: string;
  fromAr?: string;
  to?: string;
  toAr?: string;
  serviceType?: string;
  serviceTypeAr?: string;
  deliveryType?: string;
  deliveryTypeAr?: string;
  expectedDeliveryDate?: string;
  lastDestinationLog?: TrackingApiLog;
};

type TrackingApiResponse = {
  isSuccess?: boolean;
  data?: TrackingApiItem[];
};

function detectTrackingId(query: string): string | null {
  const trimmed = query.trim();

  const isLikelyPhoneNumber = (token: string): boolean => {
    const digits = token.replace(/\D/g, '');

    // Common local/international mobile formats that can appear in the contact form.
    if (/^05\d{8}$/.test(digits)) return true;      // 059XXXXXXXX
    if (/^5\d{8}$/.test(digits)) return true;       // 59XXXXXXXX
    if (/^9705\d{8}$/.test(digits)) return true;    // 97059XXXXXXX
    if (/^009705\d{8}$/.test(digits)) return true;  // 0097059XXXXXXX

    return false;
  };

  // Matches: "track 123", "تتبع 123", "track:123"
  const prefixed = trimmed.match(/^(?:track|\u062A\u062A\u0628\u0639)[:\s]+([\w\d-]+)/i);
  if (prefixed) {
    return prefixed[1];
  }

  // Matches bare AWB/number IDs like JJD014600012579976441 or 889122120814.
  const bareId = trimmed.match(/^((?:JJD|WAS|AWB)?[\dA-Z]{8,30})$/i);
  if (bareId) {
    return isLikelyPhoneNumber(bareId[1]) ? null : bareId[1];
  }

  // Fallback: extract any tracking-like token anywhere in the sentence.
  // Handles garbled/unknown prefix text such as "???? 889122120814".
  const embeddedMatches = trimmed.match(/((?:JJD|WAS|AWB)?[\dA-Z]{8,30}|\d{8,})/gi) ?? [];
  for (const match of embeddedMatches) {
    if (!isLikelyPhoneNumber(match)) {
      return match;
    }
  }

  return null;
}

async function getTrackingSummary(trackingId: string, isArabic: boolean): Promise<ResourceSearchResult> {
  const upstream = await fetch(
    `http://external.wassel.ps:4040/api/GetAwbDetails?Awbs=${encodeURIComponent(trackingId)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from('ramallah_admin:Mo@2020!').toString('base64'),
      },
    }
  );

  const payload = (await upstream.json().catch(() => ({}))) as TrackingApiResponse;
  const record = Array.isArray(payload.data) ? payload.data[0] : undefined;

  if (!upstream.ok || !payload.isSuccess || !record) {
    return {
      answer: isArabic
        ? `لم يتم العثور على معلومات للشحنة ${trackingId}.`
        : `No tracking information found for shipment ${trackingId}.`,
      relatedTopics: isArabic
        ? ['تتبع شحنة اخرى', 'التواصل مع الدعم']
        : ['Track another shipment', 'Contact support'],
    };
  }

  const status = isArabic ? (record.statusAr ?? record.status ?? '-') : (record.status ?? record.statusAr ?? '-');
  const from = isArabic ? (record.fromAr ?? record.from ?? '-') : (record.from ?? record.fromAr ?? '-');
  const to = isArabic ? (record.toAr ?? record.to ?? '-') : (record.to ?? record.toAr ?? '-');
  const serviceType = isArabic
    ? (record.serviceTypeAr ?? record.serviceType ?? '-')
    : (record.serviceType ?? record.serviceTypeAr ?? '-');
  const deliveryType = isArabic
    ? (record.deliveryTypeAr ?? record.deliveryType ?? '-')
    : (record.deliveryType ?? record.deliveryTypeAr ?? '-');
  const expectedDelivery = record.expectedDeliveryDate ?? (isArabic ? 'غير محدد' : 'N/A');

  const lastLog = record.lastDestinationLog;
  const lastAction = lastLog
    ? (isArabic ? (lastLog.portalDescriptionAr ?? lastLog.portalDescription) : (lastLog.portalDescription ?? lastLog.portalDescriptionAr))
    : undefined;
  const lastAt = lastLog
    ? [lastLog.statusDate, lastLog.statusTime].filter((v) => typeof v === 'string' && v.length > 0).join(' ')
    : '';
  const lastLocation = lastLog?.location ?? '';

  const answer = isArabic
    ? [
        `تتبع الشحنة: ${trackingId}`,
        `الحالة: ${status}`,
        `من: ${from}`,
        `الى: ${to}`,
        `الخدمة: ${serviceType} - ${deliveryType}`,
        lastAction ? `اخر تحديث${lastAt ? ` (${lastAt})` : ''}: ${lastAction}${lastLocation ? ` - ${lastLocation}` : ''}` : '',
        `التسليم المتوقع: ${expectedDelivery}`,
      ]
        .filter(Boolean)
        .join('\n')
    : [
        `Tracking: ${trackingId}`,
        `Status: ${status}`,
        `From: ${from}`,
        `To: ${to}`,
        `Service: ${serviceType} - ${deliveryType}`,
        lastAction ? `Last update${lastAt ? ` (${lastAt})` : ''}: ${lastAction}${lastLocation ? ` - ${lastLocation}` : ''}` : '',
        `Expected delivery: ${expectedDelivery}`,
      ]
        .filter(Boolean)
        .join('\n');

  return {
    answer,
    relatedTopics: isArabic
      ? ['تتبع شحنة اخرى', 'التواصل مع الدعم']
      : ['Track another shipment', 'Contact support'],
  };
}

function extractOutputText(response: any): string {
  if (typeof response?.output_text === 'string' && response.output_text) {
    return response.output_text;
  }

  const parts: string[] = [];
  const output = Array.isArray(response?.output) ? response.output : [];
  for (const item of output) {
    if (item?.type !== 'message' || !Array.isArray(item?.content)) {
      continue;
    }
    for (const content of item.content) {
      if (content?.type === 'output_text' && typeof content?.text === 'string') {
        parts.push(content.text);
      }
    }
  }

  return parts.join('').trim();
}

function parseJsonPayload(raw: string): ResourceSearchResult {
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as Partial<ResourceSearchResult>;

  return {
    answer: typeof parsed.answer === 'string' ? parsed.answer : 'I could not generate an answer right now.',
    relatedTopics: Array.isArray(parsed.relatedTopics)
      ? parsed.relatedTopics.filter((x): x is string => typeof x === 'string').slice(0, 4)
      : [],
  };
}

async function callAgentWithApiKey(prompt: string): Promise<string> {
  const base = env.AI_PROJECT_ENDPOINT.replace(/\/$/, '');
  const url = `${base}/openai/v1/responses`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.AI_PROJECT_API_KEY,
    },
    body: JSON.stringify({
      input: prompt,
      agent_reference: {
        name: env.AI_AGENT_NAME,
        version: env.AI_AGENT_VERSION,
        type: 'agent_reference',
      },
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => '');
    throw new Error(`API key request failed (${res.status}): ${details}`);
  }

  const response = await res.json();
  const outputText = extractOutputText(response);
  if (!outputText) {
    throw new Error('Empty agent response');
  }

  return outputText;
}

export async function getResourceSearchResponse(query: string): Promise<ResourceSearchResult> {
  if (!env.AI_PROJECT_ENDPOINT || !env.AI_AGENT_NAME) {
    throw Object.assign(new Error('AI agent is not configured.'), {
      code: 'AI_NOT_CONFIGURED',
      status: 500,
    });
  }

  const trackingId = detectTrackingId(query);
  if (trackingId) {
    try {
      return await getTrackingSummary(trackingId, /[\u0600-\u06FF]/.test(query));
    } catch {
      return {
        answer: /[\u0600-\u06FF]/.test(query)
          ? 'تعذر الوصول الى خدمة التتبع حاليا. يرجى المحاولة لاحقا.'
          : 'Unable to reach tracking service right now. Please try again later.',
        relatedTopics: /[\u0600-\u06FF]/.test(query)
          ? ['تتبع شحنة اخرى', 'التواصل مع الدعم']
          : ['Track another shipment', 'Contact support'],
      };
    }
  }

  const prompt = [
    'You are an expert logistics assistant for Wassel.',
    'Answer the user question clearly and concisely.',
    'Then suggest 3-4 short related topic phrases.',
    'Detect user language (English or Arabic) and respond in the same language.',
    'Return ONLY valid JSON exactly in this shape with no markdown:',
    '{"answer":"...","relatedTopics":["...","..."]}',
    '',
    `User question: ${query}`,
  ].join('\n');

  try {
    let outputText = '';

    if (env.AI_PROJECT_API_KEY) {
      outputText = await callAgentWithApiKey(prompt);
    } else {
      const projectClient = new AIProjectClient(env.AI_PROJECT_ENDPOINT, new DefaultAzureCredential());
      const openAIClient = projectClient.getOpenAIClient();

      const conversation = await openAIClient.conversations.create({
        items: [{ type: 'message', role: 'user', content: prompt }],
      });

      const response = await openAIClient.responses.create(
        { conversation: conversation.id },
        {
          body: {
            agent: {
              name: env.AI_AGENT_NAME,
              version: env.AI_AGENT_VERSION,
              type: 'agent_reference',
            },
          },
        }
      );

      outputText = extractOutputText(response);
    }

    if (!outputText) {
      throw new Error('Empty agent response');
    }

    return parseJsonPayload(outputText);
  } catch (error) {
    const message = String(error);
    const isRateLimited = message.includes('rate_limit_exceeded') || message.includes('(429)');

    throw Object.assign(new Error(`AI agent request failed: ${message}`), {
      code: isRateLimited ? 'AI_RATE_LIMITED' : 'AI_REQUEST_FAILED',
      status: isRateLimited ? 429 : 502,
    });
  }
}
