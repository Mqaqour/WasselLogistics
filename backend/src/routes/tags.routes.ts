// ─────────────────────────────────────────────────────────────────────────────
// Tags Routes
// Mounted at /api/tags in app.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as questionsController from '../controllers/questions.controller';

const router = Router();

/** GET /api/tags — list all tags */
router.get('/', questionsController.listTags);

/** POST /api/tags — create a tag */
router.post('/', questionsController.createTag);

/** DELETE /api/tags/:id */
router.delete('/:id', questionsController.deleteTag);

export default router;
