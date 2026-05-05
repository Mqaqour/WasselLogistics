// ─────────────────────────────────────────────────────────────────────────────
// Types for the Questions Knowledge Base
// All entity interfaces mirror the [kb_*] SQL Server tables.
// DTOs are the request/response shapes used by the API layer.
// ─────────────────────────────────────────────────────────────────────────────

// ── Entity interfaces ────────────────────────────────────────────────────────

export interface KbTopic {
  id: number;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

export interface KbTopicTranslation {
  id: number;
  topicId: number;
  languageCode: string;
  name: string;
  description: string | null;
}

export interface KbQuestion {
  id: number;
  topicId: number;
  intentKey: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
}

export interface KbQuestionTranslation {
  id: number;
  questionId: number;
  languageCode: string;
  questionText: string;
}

export interface KbAnswerTranslation {
  id: number;
  questionId: number;
  languageCode: string;
  answerText: string;
}

export interface KbTag {
  id: number;
  languageCode: string;
  name: string;
}

export interface KbQuestionTag {
  questionId: number;
  tagId: number;
}

export interface KbQuestionKeyword {
  id: number;
  questionId: number;
  languageCode: string;
  keyword: string;
}

export interface KbSuggestionLog {
  id: number;
  userInput: string;
  detectedLanguage: string;
  suggestedQuestionId: number | null;
  createdAt: Date;
}

// ── Internal scoring candidate (assembled in the service layer) ──────────────

export interface KbScoringCandidate {
  questionId: number;
  topicId: number;
  topicCode: string;
  topicName: string;
  intentKey: string;
  priority: number;
  questionText: string;
  answerText: string;
  keywords: string[];
  tags: string[];
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

/** One suggested question item in the /suggest response */
export interface QuestionSuggestionDto {
  questionId: number;
  topicCode: string;
  topicName: string;
  question: string;
  score: number;
}

/** Full question + answer returned by /questions/:id/answer */
export interface QuestionAnswerDto {
  questionId: number;
  topicCode: string;
  topicName: string;
  intentKey: string;
  question: string;
  answer: string;
  language: string;
}

/** Request body for POST /api/topics */
export interface CreateTopicDto {
  code: string;
  isActive?: boolean;
  translations: Array<{
    languageCode: string; // 'ar' | 'en'
    name: string;
    description?: string;
  }>;
}

/** Request body for POST /api/questions */
export interface CreateQuestionDto {
  topicCode: string;
  intentKey: string;
  priority?: number;
  isActive?: boolean;
  translations: Array<{
    languageCode: string;
    questionText: string;
    answerText: string;
  }>;
  keywords?: Array<{
    languageCode: string;
    keyword: string;
  }>;
  tagIds?: number[];
}
