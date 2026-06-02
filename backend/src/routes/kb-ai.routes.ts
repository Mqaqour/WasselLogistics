import { Router } from 'express';
import { generateKb } from '../controllers/kb-ai.controller';

const router = Router();

/** POST /api/kb/generate */
router.post('/generate', generateKb);

export default router;
