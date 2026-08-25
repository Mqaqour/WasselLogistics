import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';
import { env } from '../config/env';

export interface KbAiSuggestion {
  intentKey: string;
  questionAr: string;
  answerAr: string;
  questionEn: string;
  answerEn: string;
  keywordsAr: string[];
  keywordsEn: string[];
  suggestedTagsAr: string[];
  suggestedTagsEn: string[];
}

interface GenerateInput {
  topicCode: string;
  topicName: string;
  description: string;
  count?: number;
  existingIntentKeys?: string[];
}

function extractOutputText(response: any): string {
  if (typeof response?.output_text === 'string' && response.output_text) {
    return response.output_text;
  }
  const parts: string[] = [];
  const output = Array.isArray(response?.output) ? response.output : [];
  for (const item of output) {
    if (item?.type !== 'message' || !Array.isArray(item?.content)) continue;
    for (const content of item.content) {
      if (content?.type === 'output_text' && typeof content?.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('').trim();
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
    throw new Error(`AI agent request failed (${res.status}): ${details}`);
  }

  return extractOutputText(await res.json());
}

export async function generateKbSuggestions(input: GenerateInput): Promise<KbAiSuggestion[]> {
  if (!env.AI_PROJECT_ENDPOINT || !env.AI_AGENT_NAME) {
    throw new Error('AI agent environment variables are not configured');
  }

  const count = Math.min(Math.max(input.count ?? 5, 1), 10);
  const existingKeys = input.existingIntentKeys?.join(', ') ?? '';

  const prompt = [
    'You are a logistics knowledge base assistant for Wassel, a Palestinian logistics company.',
    'Generate Q&A pairs for an admin knowledge base.',
    'Respond ONLY with valid JSON — no markdown, no extra text.',
    '',
    `Generate exactly ${count} knowledge base Q&A entries for the following topic:`,
    `- Topic Code: ${input.topicCode}`,
    `- Topic Name: ${input.topicName}`,
    `- Description: ${input.description}`,
    existingKeys ? `- Existing intent keys (do NOT reuse): ${existingKeys}` : '',
    '',
    'Return a JSON object with this structure:',
    '{"suggestions":[{"intentKey":"unique_snake_case_key","questionAr":"السؤال بالعربية","answerAr":"الجواب بالعربية","questionEn":"Question in English","answerEn":"Answer in English","keywordsAr":["كلمة1","كلمة2"],"keywordsEn":["word1","word2"],"suggestedTagsAr":["وسم1"],"suggestedTagsEn":["tag1"]}]}',
    '',
    'Rules:',
    '- intentKey must be unique snake_case, prefixed with the topic code in lowercase',
    '- Arabic answers should be clear and professional',
    '- Include 3-6 keywords per language',
    '- Include 1-3 relevant tags per language',
  ].filter(line => line !== undefined).join('\n');

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

  if (!outputText) throw new Error('Empty response from AI agent');

  const jsonMatch = outputText.replace(/```json|```/g, '').trim().match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract JSON from AI agent response');

  const parsed = JSON.parse(jsonMatch[0]) as { suggestions: KbAiSuggestion[] };
  if (!Array.isArray(parsed.suggestions)) throw new Error('Invalid response structure from AI agent');

  return parsed.suggestions;
}
