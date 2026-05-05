// ─────────────────────────────────────────────────────────────────────────────
// Questions Knowledge Base — Routes
// Mounted at /api/questions and /api/topics in app.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as questionsController from '../controllers/questions.controller';

const router = Router();

// ── /api/questions ────────────────────────────────────────────────────────────

/**
 * GET /api/questions/suggest?query=...&language=ar
 * Must be declared BEFORE /:id/answer so Express does not interpret
 * "suggest" as an :id parameter.
 */
router.get('/suggest', questionsController.suggestQuestions);

/** GET /api/questions/:id/answer?language=ar */
router.get('/:id/answer', questionsController.getQuestionAnswer);

/** POST /api/questions — create a new question */
router.post('/', questionsController.createQuestion);

export default router;
