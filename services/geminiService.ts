const BACKEND_URL = import.meta.env.VITE_CHAT_BACKEND_URL?.trim() ?? '';

type ResourceSearchResult = {
  answer: string;
  relatedTopics: string[];
};

export type AssistantConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
};

type ResourceSearchOptions = {
  conversationId?: string;
  conversationHistory?: AssistantConversationTurn[];
};

// Kept for compatibility; this app currently uses only resource-search.
export const getGeminiResponse = async (): Promise<string> => {
  return "This chat endpoint is not enabled in the frontend. Use the website chat widget.";
};

const buildUrl = (path: string): string => (BACKEND_URL ? `${BACKEND_URL}${path}` : path);

const isArabicQuery = (text: string): boolean => /[؀-ۿ]/.test(text);

const buildFallback = (query: string, isRateLimited: boolean): ResourceSearchResult => {
  const ar = isArabicQuery(query);
  if (isRateLimited) {
    return {
      answer: ar
        ? 'يوجد ضغط مرتفع حالياً على خدمة الذكاء الاصطناعي. يرجى المحاولة بعد قليل.'
        : 'The AI service is receiving too many requests right now. Please try again in a moment.',
      relatedTopics: [],
    };
  }

  return {
    answer: ar
      ? 'تعذر العثور على إجابة حالياً. يمكنك تصفح المواضيع بالأسفل.'
      : "I couldn't find an answer at the moment. Please browse our categories below.",
    relatedTopics: [],
  };
};

export const getResourceSearchResponse = async (
  query: string,
  options?: ResourceSearchOptions,
): Promise<ResourceSearchResult> => {
  try {
    const res = await fetch(buildUrl('/api/ai/resource-search'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        conversationId: options?.conversationId,
        conversationHistory: options?.conversationHistory,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const isRateLimited =
        res.status === 429 ||
        errText.includes('AI_RATE_LIMITED') ||
        errText.includes('rate_limit_exceeded');

      if (isRateLimited) {
        return buildFallback(query, true);
      }

      console.warn(`Resource search failed (${res.status})`);
      return buildFallback(query, false);
    }

    return await res.json();
  } catch (error) {
    console.warn('Resource Search API unavailable:', error);
    return buildFallback(query, false);
  }
};
