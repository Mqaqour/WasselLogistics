const BACKEND_URL = import.meta.env.VITE_CHAT_BACKEND_URL?.trim() ?? '';

type ResourceSearchResult = {
  answer: string;
  relatedTopics: string[];
};

// Kept for compatibility; this app currently uses only resource-search.
export const getGeminiResponse = async (): Promise<string> => {
  return "This chat endpoint is not enabled in the frontend. Use the website chat widget.";
};

export const getResourceSearchResponse = async (query: string): Promise<ResourceSearchResult> => {
  if (!BACKEND_URL) {
    return {
      answer: "I'm sorry, I'm currently offline (backend URL missing).",
      relatedTopics: [],
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/ai/resource-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resource search failed (${res.status}): ${errText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Resource Search API Error:', error);
    return {
      answer: "I couldn't find an answer at the moment. Please browse our categories below.",
      relatedTopics: [],
    };
  }
};
