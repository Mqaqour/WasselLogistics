import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { aiChatLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/resource-search', aiChatLimiter, aiController.resourceSearch);

export default router;
