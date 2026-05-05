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
