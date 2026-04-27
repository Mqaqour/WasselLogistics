import { Router } from 'express';
import { authRespondio } from '../middleware/authRespondio';
import { validateBody } from '../middleware/validateRequest';
import { respondioMessageSchema } from '../validators/chat.validators';
import * as respondioController from '../controllers/respondio.controller';

const router = Router();

router.post('/message',
  authRespondio,
  validateBody(respondioMessageSchema),
  respondioController.receiveAgentMessage
);

export default router;
