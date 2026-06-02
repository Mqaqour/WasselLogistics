// ─────────────────────────────────────────────────────────────────────────────
// QuestionsController
// Handles all HTTP requests for the /api/questions and /api/topics routes.
// ─────────────────────────────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import { questionSuggestionService } from '../services/questions.service';
import { CreateTopicDto, CreateQuestionDto } from '../types/questions.types';

/**
 * GET /api/questions/suggest?query={text}&language={ar|en}
 *
 * Returns up to 10 suggested questions ranked by relevance.
 * Language is optional — auto-detected from the query text when omitted.
 */
export async function suggestQuestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query    = String(req.query.query    ?? '').trim();
    const language = String(req.query.language ?? '').trim() || undefined;

    if (!query) {
      res.status(400).json({ error: 'query parameter is required' });
      return;
    }

    const result = await questionSuggestionService.suggest(query, language);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/questions/:id/answer?language={ar|en}
 *
 * Returns the full question text and answer for the given question id.
 * Language defaults to 'ar' when not provided.
 */
export async function getQuestionAnswer(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id       = parseInt(req.params.id, 10);
    const language = String(req.query.language ?? 'ar').trim();

    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: 'Invalid question id' });
      return;
    }

    const result = await questionSuggestionService.getAnswer(id, language);

    if (!result) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/topics?language={ar|en}
 *
 * Returns all active topics with their translated names.
 * Language defaults to 'ar' when not provided.
 */
export async function getTopics(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const language = String(req.query.language ?? 'ar').trim();
    const topics   = await questionSuggestionService.getTopics(language);
    res.json({ language, topics });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/questions
 *
 * Creates a new question with Arabic and English translations.
 *
 * Body: CreateQuestionDto
 */
export async function createQuestion(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateQuestionDto;

    if (!dto.topicCode || !dto.intentKey || !Array.isArray(dto.translations) || dto.translations.length === 0) {
      res.status(400).json({ error: 'topicCode, intentKey and at least one translation are required' });
      return;
    }

    const id = await questionSuggestionService.createQuestion(dto);

    if (id === null) {
      res.status(409).json({ error: `A question with intentKey "${dto.intentKey}" already exists` });
      return;
    }

    res.status(201).json({ questionId: id });
  } catch (err) {
    next(err);
  }
}

// ── Admin: list questions ─────────────────────────────────────────────────────

/** GET /api/questions?topicCode=...&language=ar */
export async function listQuestions(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const language  = String(req.query.language  ?? 'ar').trim();
    const topicCode = req.query.topicCode ? String(req.query.topicCode).trim() : undefined;
    const questions = await questionSuggestionService.listQuestions(language, topicCode);
    res.json({ language, questions });
  } catch (err) { next(err); }
}

// ── Admin: delete question ────────────────────────────────────────────────────

/** DELETE /api/questions/:id */
export async function deleteQuestion(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const deleted = await questionSuggestionService.deleteQuestion(id);
    if (!deleted) { res.status(404).json({ error: 'Question not found' }); return; }
    res.json({ deleted: true });
  } catch (err) { next(err); }
}

// ── Admin: delete topic ───────────────────────────────────────────────────────

/** DELETE /api/topics/:id */
export async function deleteTopic(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const deleted = await questionSuggestionService.deleteTopic(id);
    if (!deleted) { res.status(404).json({ error: 'Topic not found' }); return; }
    res.json({ deleted: true });
  } catch (err) { next(err); }
}

// ── Admin: tags ───────────────────────────────────────────────────────────────

/** GET /api/tags */
export async function listTags(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const tags = await questionSuggestionService.listTags();
    res.json({ tags });
  } catch (err) { next(err); }
}

/** POST /api/tags  body: { languageCode, name } */
export async function createTag(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const { languageCode, name } = req.body as { languageCode: string; name: string };
    if (!languageCode || !name) { res.status(400).json({ error: 'languageCode and name are required' }); return; }
    const id = await questionSuggestionService.createTag(languageCode.trim(), name.trim());
    res.status(201).json({ tagId: id });
  } catch (err) { next(err); }
}

/** DELETE /api/tags/:id */
export async function deleteTag(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const deleted = await questionSuggestionService.deleteTag(id);
    if (!deleted) { res.status(404).json({ error: 'Tag not found' }); return; }
    res.json({ deleted: true });
  } catch (err) { next(err); }
}

/** GET /api/questions/:id/tags */
export async function getQuestionTags(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const tags = await questionSuggestionService.getTagsForQuestion(id);
    res.json({ tags });
  } catch (err) { next(err); }
}

/** POST /api/questions/:id/tags  body: { tagId } */
export async function addTagToQuestion(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const questionId = parseInt(req.params.id, 10);
    const tagId      = parseInt(req.body.tagId, 10);
    if (isNaN(questionId) || isNaN(tagId)) { res.status(400).json({ error: 'Invalid ids' }); return; }
    await questionSuggestionService.linkTag(questionId, tagId);
    res.json({ linked: true });
  } catch (err) { next(err); }
}

/** DELETE /api/questions/:id/tags/:tagId */
export async function removeTagFromQuestion(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const questionId = parseInt(req.params.id,    10);
    const tagId      = parseInt(req.params.tagId, 10);
    if (isNaN(questionId) || isNaN(tagId)) { res.status(400).json({ error: 'Invalid ids' }); return; }
    await questionSuggestionService.unlinkTag(questionId, tagId);
    res.json({ unlinked: true });
  } catch (err) { next(err); }
}

/**
 * POST /api/topics
 *
 * Creates a new topic with Arabic and English translations.
 *
 * Body: CreateTopicDto
 */
export async function createTopic(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dto = req.body as CreateTopicDto;

    if (!dto.code || !Array.isArray(dto.translations) || dto.translations.length === 0) {
      res.status(400).json({ error: 'code and at least one translation are required' });
      return;
    }

    const id = await questionSuggestionService.createTopic(dto);

    if (id === null) {
      res.status(409).json({ error: `A topic with code "${dto.code}" already exists` });
      return;
    }

    res.status(201).json({ topicId: id });
  } catch (err) {
    next(err);
  }
}

/** GET /api/questions/:id/edit — fetch full question for editing */
export async function getQuestionForEdit(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const data = await questionSuggestionService.getQuestionForEdit(id);
    if (!data) { res.status(404).json({ error: 'Question not found' }); return; }
    res.json(data);
  } catch (err) { next(err); }
}

/** PATCH /api/questions/:id — update question */
export async function patchQuestion(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const updated = await questionSuggestionService.updateQuestion(id, req.body);
    if (!updated) { res.status(404).json({ error: 'Question not found' }); return; }
    res.json({ updated: true });
  } catch (err) { next(err); }
}

/** GET /api/topics/:id — get topic with all translations */
export async function getTopicById(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const data = await questionSuggestionService.getTopicById(id);
    if (!data) { res.status(404).json({ error: 'Topic not found' }); return; }
    res.json(data);
  } catch (err) { next(err); }
}

/** PATCH /api/topics/:id — update topic translations */
export async function patchTopic(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) { res.status(400).json({ error: 'Invalid id' }); return; }
    const { translations } = req.body as { translations: Array<{ languageCode: string; name: string; description?: string | null }> };
    if (!Array.isArray(translations) || translations.length === 0) {
      res.status(400).json({ error: 'translations array is required' }); return;
    }
    const updated = await questionSuggestionService.updateTopic(id, translations);
    if (!updated) { res.status(404).json({ error: 'Topic not found' }); return; }
    res.json({ updated: true });
  } catch (err) { next(err); }
}
