// ─────────────────────────────────────────────────────────────────────────────
// Topics Routes
// Mounted at /api/topics in app.ts
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as questionsController from '../controllers/questions.controller';

const router = Router();

/** GET /api/topics?language=ar — list all active topics */
router.get('/', questionsController.getTopics);

/** POST /api/topics — create a new topic */
router.post('/', questionsController.createTopic);

export default router;
