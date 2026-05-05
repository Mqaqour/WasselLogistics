// ─────────────────────────────────────────────────────────────────────────────
// IQuestionSuggestionService interface + QuestionSuggestionService implementation
//
// Suggestion scoring rules (additive):
//   +20  Exact question text match (normalised)
//   +12  Question text contains the full normalised query as a substring
//   +10  A keyword matches one of the query tokens
//   + 8  A tag matches one of the query tokens
//   + 5  Topic name contains one of the query tokens
//   + 3  Answer text contains one of the query tokens
//   + N  Question.priority (base boost)
//
// The top 10 highest-scored, active questions are returned.
// ─────────────────────────────────────────────────────────────────────────────
import {
  fetchScoringCandidates,
  fetchQuestionWithAnswer,
  fetchActiveTopics,
  insertTopic,
  insertQuestion,
  logSuggestion,
} from '../repositories/questions.repository';
import {
  QuestionSuggestionDto,
  QuestionAnswerDto,
  CreateTopicDto,
  CreateQuestionDto,
  KbScoringCandidate,
} from '../types/questions.types';
import {
  detectLanguage,
  normalizeArabic,
  tokenize,
} from '../utils/arabicNormalizer';
import { logger } from '../utils/logger';

// ── Interface ─────────────────────────────────────────────────────────────────

export interface IQuestionSuggestionService {
  /** Return up to 10 ranked question suggestions for the given query. */
  suggest(
    query: string,
    language?: string,
  ): Promise<{ query: string; language: string; suggestions: QuestionSuggestionDto[] }>;

  /** Return a single question with its full answer. */
  getAnswer(questionId: number, language: string): Promise<QuestionAnswerDto | null>;

  /** Return all active topics with translated names. */
  getTopics(language: string): Promise<Array<{ id: number; code: string; name: string; description: string | null }>>;

  /** Create a new topic. Returns the new id or null on duplicate. */
  createTopic(dto: CreateTopicDto): Promise<number | null>;

  /** Create a new question. Returns the new id or null on duplicate. */
  createQuestion(dto: CreateQuestionDto): Promise<number | null>;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class QuestionSuggestionService implements IQuestionSuggestionService {

  // ── suggest ────────────────────────────────────────────────────────────────

  async suggest(
    query: string,
    language?: string,
  ): Promise<{ query: string; language: string; suggestions: QuestionSuggestionDto[] }> {
    // 1. Detect / resolve language
    const lang = language === 'ar' || language === 'en'
      ? language
      : detectLanguage(query);

    // 2. Normalise the raw query and tokenise it
    const normalisedQuery = lang === 'ar'
      ? normalizeArabic(query)
      : query.trim().toLowerCase();
    const tokens = tokenize(query); // already normalised inside tokenize()

    if (!normalisedQuery || tokens.length === 0) {
      return { query, language: lang, suggestions: [] };
    }

    // 3. Load all scoring candidates from the DB
    const { rows, keywords, tags } = await fetchScoringCandidates(lang);

    // Build lookup maps for keywords and tags keyed by questionId
    const kwMap = new Map<number, string[]>();
    for (const kw of keywords) {
      const list = kwMap.get(kw.questionId) ?? [];
      list.push(kw.keyword);
      kwMap.set(kw.questionId, list);
    }

    const tagMap = new Map<number, string[]>();
    for (const tg of tags) {
      const list = tagMap.get(tg.questionId) ?? [];
      list.push(tg.tagName);
      tagMap.set(tg.questionId, list);
    }

    // Assemble full candidates
    const candidates: KbScoringCandidate[] = rows.map(r => ({
      questionId:   r.questionId,
      topicId:      r.topicId,
      topicCode:    r.topicCode,
      topicName:    r.topicName,
      intentKey:    r.intentKey,
      priority:     r.priority,
      questionText: r.questionText,
      answerText:   r.answerText,
      keywords:     kwMap.get(r.questionId) ?? [],
      tags:         tagMap.get(r.questionId) ?? [],
    }));

    // 4. Score each candidate
    const scored: Array<{ candidate: KbScoringCandidate; score: number }> = [];

    for (const c of candidates) {
      const score = this._score(c, normalisedQuery, tokens, lang);
      if (score > 0) {
        scored.push({ candidate: c, score });
      }
    }

    // 5. Sort descending by score, take top 10
    scored.sort((a, b) => b.score - a.score);
    const top10 = scored.slice(0, 10);

    // 6. Persist the log (fire-and-forget)
    const topQuestionId = top10.length > 0 ? top10[0].candidate.questionId : null;
    logSuggestion(query, lang, topQuestionId).catch(() => { /* non-fatal */ });

    // 7. Build response DTOs
    const suggestions: QuestionSuggestionDto[] = top10.map(({ candidate, score }) => ({
      questionId: candidate.questionId,
      topicCode:  candidate.topicCode,
      topicName:  candidate.topicName,
      question:   candidate.questionText,
      score,
    }));

    return { query, language: lang, suggestions };
  }

  // ── _score (private) ───────────────────────────────────────────────────────

  /**
   * Compute an additive relevance score for one candidate question.
   *
   * @param c               The candidate question with all its text fields.
   * @param normalisedQuery The full normalised query string.
   * @param tokens          Individual normalised tokens from the query.
   * @param lang            Language being used ('ar' | 'en').
   */
  private _score(
    c: KbScoringCandidate,
    normalisedQuery: string,
    tokens: string[],
    lang: string,
  ): number {
    let score = 0;

    // Helper: normalise a stored string for comparison
    const norm = (s: string) =>
      lang === 'ar' ? normalizeArabic(s) : s.trim().toLowerCase();

    const normQuestion  = norm(c.questionText);
    const normAnswer    = norm(c.answerText);
    const normTopicName = norm(c.topicName);
    const normKeywords  = c.keywords.map(norm);
    const normTags      = c.tags.map(norm);

    // ── Rule 1: Exact question match (+20) ──────────────────────────────────
    if (normQuestion === normalisedQuery) {
      score += 20;
    }

    // ── Rule 2: Question contains full query as substring (+12) ────────────
    else if (normQuestion.includes(normalisedQuery)) {
      score += 12;
    }

    // ── Rule 3: Keyword matches any token (+10 per matching token, capped) ─
    for (const token of tokens) {
      if (normKeywords.some(kw => kw === token || kw.includes(token))) {
        score += 10;
        break; // count only once per question
      }
    }

    // ── Rule 4: Tag matches any token (+8, once) ────────────────────────────
    for (const token of tokens) {
      if (normTags.some(tag => tag === token || tag.includes(token))) {
        score += 8;
        break;
      }
    }

    // ── Rule 5: Topic name contains any token (+5, once) ───────────────────
    for (const token of tokens) {
      if (normTopicName.includes(token)) {
        score += 5;
        break;
      }
    }

    // ── Rule 6: Answer text contains any token (+3, once) ──────────────────
    if (normAnswer) {
      for (const token of tokens) {
        if (normAnswer.includes(token)) {
          score += 3;
          break;
        }
      }
    }

    // ── Rule 7: Add question priority as a base boost ───────────────────────
    if (score > 0) {
      score += c.priority;
    }

    return score;
  }

  // ── getAnswer ──────────────────────────────────────────────────────────────

  async getAnswer(questionId: number, language: string): Promise<QuestionAnswerDto | null> {
    return fetchQuestionWithAnswer(questionId, language);
  }

  // ── getTopics ──────────────────────────────────────────────────────────────

  async getTopics(language: string): Promise<Array<{
    id: number;
    code: string;
    name: string;
    description: string | null;
  }>> {
    return fetchActiveTopics(language);
  }

  // ── createTopic ────────────────────────────────────────────────────────────

  async createTopic(dto: CreateTopicDto): Promise<number | null> {
    return insertTopic(dto);
  }

  // ── createQuestion ─────────────────────────────────────────────────────────

  async createQuestion(dto: CreateQuestionDto): Promise<number | null> {
    return insertQuestion(dto);
  }
}

// Singleton instance — imported by the controller
export const questionSuggestionService: IQuestionSuggestionService =
  new QuestionSuggestionService();
