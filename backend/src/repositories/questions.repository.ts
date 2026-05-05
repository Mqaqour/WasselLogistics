// ─────────────────────────────────────────────────────────────────────────────
// Questions Knowledge Base — Repository
// All database access for the [kb_*] tables lives here.
// Uses the shared SQL Server connection pool from config/database.ts.
// ─────────────────────────────────────────────────────────────────────────────
import { getPool, sql } from '../config/database';
import { logger } from '../utils/logger';
import {
  KbScoringCandidate,
  QuestionAnswerDto,
  KbTopic,
  KbTopicTranslation,
  CreateTopicDto,
  CreateQuestionDto,
} from '../types/questions.types';

// ── Suggestion / scoring data ─────────────────────────────────────────────────

/**
 * Fetch all active questions for a given language, with the data needed for
 * scoring (topic name, question text, answer text, keywords, tags).
 * Returns three parallel arrays that the service layer joins by questionId.
 */
export async function fetchScoringCandidates(language: string): Promise<{
  rows: Array<{
    questionId: number;
    topicId: number;
    topicCode: string;
    topicName: string;
    intentKey: string;
    priority: number;
    questionText: string;
    answerText: string;
  }>;
  keywords: Array<{ questionId: number; keyword: string }>;
  tags: Array<{ questionId: number; tagName: string }>;
}> {
  const pool = await getPool();

  // Main candidates query: join questions → topics → translations → answers
  const candidatesResult = await pool.request()
    .input('lang', sql.NVarChar(5), language)
    .query<{
      questionId: number;
      topicId: number;
      topicCode: string;
      topicName: string;
      intentKey: string;
      priority: number;
      questionText: string;
      answerText: string;
    }>(`
      SELECT
        q.id                     AS questionId,
        q.topic_id               AS topicId,
        t.code                   AS topicCode,
        tt.name                  AS topicName,
        q.intent_key             AS intentKey,
        q.priority               AS priority,
        qt.question_text         AS questionText,
        ISNULL(at2.answer_text, N'') AS answerText
      FROM  kb_questions             q
      JOIN  kb_topics                t   ON t.id = q.topic_id
      -- Topic translation for the requested language (fall back to 'en')
      LEFT JOIN kb_topic_translations    tt  ON tt.topic_id = t.id
                                            AND tt.language_code = @lang
      -- Question translation
      LEFT JOIN kb_question_translations qt  ON qt.question_id = q.id
                                            AND qt.language_code = @lang
      -- Answer translation
      LEFT JOIN kb_answer_translations   at2 ON at2.question_id = q.id
                                            AND at2.language_code = @lang
      WHERE q.is_active = 1
        AND t.is_active = 1
        AND qt.question_text IS NOT NULL   -- only questions that have this language
    `);

  // Keywords for the requested language
  const keywordsResult = await pool.request()
    .input('lang', sql.NVarChar(5), language)
    .query<{ questionId: number; keyword: string }>(`
      SELECT kw.question_id AS questionId, kw.keyword
      FROM  kb_question_keywords kw
      JOIN  kb_questions q ON q.id = kw.question_id
      WHERE kw.language_code = @lang
        AND q.is_active = 1
    `);

  // Tags for the requested language associated with active questions
  const tagsResult = await pool.request()
    .input('lang', sql.NVarChar(5), language)
    .query<{ questionId: number; tagName: string }>(`
      SELECT qt.question_id AS questionId, tg.name AS tagName
      FROM  kb_question_tags  qt
      JOIN  kb_tags            tg ON tg.id = qt.tag_id
      JOIN  kb_questions       q  ON q.id  = qt.question_id
      WHERE tg.language_code = @lang
        AND q.is_active = 1
    `);

  return {
    rows:     candidatesResult.recordset,
    keywords: keywordsResult.recordset,
    tags:     tagsResult.recordset,
  };
}

// ── Single question + answer ──────────────────────────────────────────────────

/**
 * Fetch a single question with its translated answer.
 * Returns null when the question does not exist or is inactive.
 */
export async function fetchQuestionWithAnswer(
  questionId: number,
  language: string,
): Promise<QuestionAnswerDto | null> {
  const pool = await getPool();

  const result = await pool.request()
    .input('qid',  sql.Int,        questionId)
    .input('lang', sql.NVarChar(5), language)
    .query<{
      questionId: number;
      topicCode: string;
      topicName: string;
      intentKey: string;
      questionText: string;
      answerText: string;
    }>(`
      SELECT
        q.id                           AS questionId,
        t.code                         AS topicCode,
        ISNULL(tt.name, t.code)        AS topicName,
        q.intent_key                   AS intentKey,
        ISNULL(qt.question_text, N'')  AS questionText,
        ISNULL(at2.answer_text,  N'')  AS answerText
      FROM  kb_questions             q
      JOIN  kb_topics                t   ON t.id = q.topic_id
      LEFT JOIN kb_topic_translations    tt  ON tt.topic_id = t.id
                                            AND tt.language_code = @lang
      LEFT JOIN kb_question_translations qt  ON qt.question_id = q.id
                                            AND qt.language_code = @lang
      LEFT JOIN kb_answer_translations   at2 ON at2.question_id = q.id
                                            AND at2.language_code = @lang
      WHERE q.id = @qid
        AND q.is_active = 1
    `);

  const row = result.recordset[0];
  if (!row) return null;

  return {
    questionId: row.questionId,
    topicCode:  row.topicCode,
    topicName:  row.topicName,
    intentKey:  row.intentKey,
    question:   row.questionText,
    answer:     row.answerText,
    language,
  };
}

// ── Active topics ─────────────────────────────────────────────────────────────

/**
 * Return all active topics with their translated name / description.
 */
export async function fetchActiveTopics(language: string): Promise<Array<{
  id: number;
  code: string;
  name: string;
  description: string | null;
}>> {
  const pool = await getPool();

  const result = await pool.request()
    .input('lang', sql.NVarChar(5), language)
    .query<{ id: number; code: string; name: string; description: string | null }>(`
      SELECT
        t.id,
        t.code,
        ISNULL(tt.name, t.code)   AS name,
        tt.description
      FROM  kb_topics             t
      LEFT JOIN kb_topic_translations tt ON tt.topic_id = t.id
                                       AND tt.language_code = @lang
      WHERE t.is_active = 1
      ORDER BY t.id
    `);

  return result.recordset;
}

// ── Create topic ──────────────────────────────────────────────────────────────

/**
 * Insert a new topic and its translations.
 * Returns the new topic id, or null if the code already exists.
 */
export async function insertTopic(dto: CreateTopicDto): Promise<number | null> {
  const pool = await getPool();

  // Check for duplicate code
  const existing = await pool.request()
    .input('code', sql.NVarChar(100), dto.code)
    .query<{ id: number }>(`SELECT id FROM kb_topics WHERE code = @code`);

  if (existing.recordset.length > 0) {
    logger.warn(`insertTopic: code "${dto.code}" already exists.`);
    return null;
  }

  // Insert topic
  const topicResult = await pool.request()
    .input('code',     sql.NVarChar(100), dto.code)
    .input('isActive', sql.Bit,           dto.isActive ?? true)
    .query<{ id: number }>(`
      INSERT INTO kb_topics (code, is_active)
      OUTPUT INSERTED.id
      VALUES (@code, @isActive)
    `);

  const topicId = topicResult.recordset[0].id;

  // Insert translations
  for (const t of dto.translations) {
    await pool.request()
      .input('topicId',  sql.Int,           topicId)
      .input('lang',     sql.NVarChar(5),   t.languageCode)
      .input('name',     sql.NVarChar(500), t.name)
      .input('desc',     sql.NVarChar(2000), t.description ?? null)
      .query(`
        INSERT INTO kb_topic_translations (topic_id, language_code, name, description)
        VALUES (@topicId, @lang, @name, @desc)
      `);
  }

  logger.info(`insertTopic: created topic "${dto.code}" (id=${topicId})`);
  return topicId;
}

// ── Create question ───────────────────────────────────────────────────────────

/**
 * Insert a new question (with translations, keywords, tag links).
 * Returns the new question id, or null when the intentKey already exists.
 */
export async function insertQuestion(dto: CreateQuestionDto): Promise<number | null> {
  const pool = await getPool();

  // Resolve topic id by code
  const topicRow = await pool.request()
    .input('code', sql.NVarChar(100), dto.topicCode)
    .query<{ id: number }>(`SELECT id FROM kb_topics WHERE code = @code`);

  if (topicRow.recordset.length === 0) {
    throw new Error(`insertQuestion: topic code "${dto.topicCode}" not found.`);
  }
  const topicId = topicRow.recordset[0].id;

  // Check for duplicate intentKey
  const existing = await pool.request()
    .input('intentKey', sql.NVarChar(200), dto.intentKey)
    .query<{ id: number }>(`SELECT id FROM kb_questions WHERE intent_key = @intentKey`);

  if (existing.recordset.length > 0) {
    logger.warn(`insertQuestion: intentKey "${dto.intentKey}" already exists.`);
    return null;
  }

  // Insert question
  const qResult = await pool.request()
    .input('topicId',   sql.Int,          topicId)
    .input('intentKey', sql.NVarChar(200), dto.intentKey)
    .input('priority',  sql.Int,          dto.priority ?? 5)
    .input('isActive',  sql.Bit,          dto.isActive ?? true)
    .query<{ id: number }>(`
      INSERT INTO kb_questions (topic_id, intent_key, priority, is_active)
      OUTPUT INSERTED.id
      VALUES (@topicId, @intentKey, @priority, @isActive)
    `);

  const questionId = qResult.recordset[0].id;

  // Insert question + answer translations
  for (const t of dto.translations) {
    await pool.request()
      .input('qid',          sql.Int,          questionId)
      .input('lang',         sql.NVarChar(5),  t.languageCode)
      .input('questionText', sql.NVarChar(2000), t.questionText)
      .query(`
        INSERT INTO kb_question_translations (question_id, language_code, question_text)
        VALUES (@qid, @lang, @questionText)
      `);

    await pool.request()
      .input('qid',        sql.Int,         questionId)
      .input('lang',       sql.NVarChar(5), t.languageCode)
      .input('answerText', sql.NVarChar(sql.MAX), t.answerText)
      .query(`
        INSERT INTO kb_answer_translations (question_id, language_code, answer_text)
        VALUES (@qid, @lang, @answerText)
      `);
  }

  // Insert keywords
  if (dto.keywords) {
    for (const kw of dto.keywords) {
      await pool.request()
        .input('qid',     sql.Int,          questionId)
        .input('lang',    sql.NVarChar(5),  kw.languageCode)
        .input('keyword', sql.NVarChar(300), kw.keyword)
        .query(`
          INSERT INTO kb_question_keywords (question_id, language_code, keyword)
          VALUES (@qid, @lang, @keyword)
        `);
    }
  }

  // Link tags
  if (dto.tagIds) {
    for (const tagId of dto.tagIds) {
      await pool.request()
        .input('qid',   sql.Int, questionId)
        .input('tagId', sql.Int, tagId)
        .query(`
          INSERT INTO kb_question_tags (question_id, tag_id)
          VALUES (@qid, @tagId)
        `);
    }
  }

  logger.info(`insertQuestion: created question "${dto.intentKey}" (id=${questionId})`);
  return questionId;
}

// ── Suggestion log ────────────────────────────────────────────────────────────

/**
 * Record a user query and the top suggested question in kb_suggestion_logs.
 * Non-fatal: logs a warning on failure rather than throwing.
 */
export async function logSuggestion(
  userInput: string,
  detectedLanguage: string,
  suggestedQuestionId: number | null,
): Promise<void> {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userInput',   sql.NVarChar(1000), userInput.substring(0, 1000))
      .input('lang',        sql.NVarChar(5),    detectedLanguage)
      .input('questionId',  sql.Int,            suggestedQuestionId)
      .query(`
        INSERT INTO kb_suggestion_logs (user_input, detected_language, suggested_question_id)
        VALUES (@userInput, @lang, @questionId)
      `);
  } catch (err) {
    logger.warn('logSuggestion failed (non-fatal):', err);
  }
}
