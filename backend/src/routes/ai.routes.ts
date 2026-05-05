import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';

const router = Router();

router.post('/resource-search', aiController.resourceSearch);

export default router;
