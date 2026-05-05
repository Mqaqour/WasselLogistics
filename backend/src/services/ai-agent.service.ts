import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';
import { env } from '../config/env';

type ResourceSearchResult = {
  answer: string;
  relatedTopics: string[];
};

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
            agent_reference: {
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
    throw Object.assign(new Error(`AI agent request failed: ${String(error)}`), {
      code: 'AI_REQUEST_FAILED',
      status: 502,
    });
  }
}
