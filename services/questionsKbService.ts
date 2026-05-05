const BACKEND_URL = import.meta.env.VITE_CHAT_BACKEND_URL?.trim() ?? '';

export type QuestionSuggestionItem = {
  questionId: number;
  topicCode: string;
  topicName: string;
  question: string;
  score: number;
};

type SuggestResponse = {
  query: string;
  language: 'ar' | 'en';
  suggestions: QuestionSuggestionItem[];
};

type AnswerResponse = {
  questionId: number;
  topicCode: string;
  topicName: string;
  intentKey: string;
  question: string;
  answer: string;
  language: 'ar' | 'en';
};

function buildUrl(path: string): string {
  return BACKEND_URL ? `${BACKEND_URL}${path}` : path;
}

export async function suggestKbQuestions(query: string, language: 'ar' | 'en'): Promise<QuestionSuggestionItem[]> {
  const url = new URL(buildUrl('/api/questions/suggest'), window.location.origin);
  url.searchParams.set('query', query);
  url.searchParams.set('language', language);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Suggest request failed (${res.status})`);
  }

  const data = (await res.json()) as SuggestResponse;
  return Array.isArray(data.suggestions) ? data.suggestions : [];
}

export async function getKbQuestionAnswer(questionId: number, language: 'ar' | 'en'): Promise<AnswerResponse> {
  const url = new URL(buildUrl(`/api/questions/${questionId}/answer`), window.location.origin);
  url.searchParams.set('language', language);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Answer request failed (${res.status})`);
  }

  return (await res.json()) as AnswerResponse;
}
