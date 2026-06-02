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

/** GET /api/questions?topicCode=...&language=ar  (admin: list all) */
router.get('/', questionsController.listQuestions);

/** GET /api/questions/:id/answer?language=ar */
router.get('/:id/answer', questionsController.getQuestionAnswer);

/** GET /api/questions/:id/tags */
router.get('/:id/tags', questionsController.getQuestionTags);

/** POST /api/questions/:id/tags */
router.post('/:id/tags', questionsController.addTagToQuestion);

/** DELETE /api/questions/:id/tags/:tagId */
router.delete('/:id/tags/:tagId', questionsController.removeTagFromQuestion);

/** POST /api/questions — create a new question */
router.post('/', questionsController.createQuestion);

/** GET /api/questions/:id/edit — full data for editing */
router.get('/:id/edit', questionsController.getQuestionForEdit);

/** PATCH /api/questions/:id — update question */
router.patch('/:id', questionsController.patchQuestion);

/** DELETE /api/questions/:id */
router.delete('/:id', questionsController.deleteQuestion);

export default router;
