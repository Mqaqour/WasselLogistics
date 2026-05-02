import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest';
import { authRespondio } from '../middleware/authRespondio';
import { respondioMessageSchema } from '../validators/chat.validators';
import * as respondioController from '../controllers/respondio.controller';

const router = Router();

// respond.io authenticates outgoing webhooks via Bearer token
router.post('/message',
  authRespondio,
  validateBody(respondioMessageSchema),
  respondioController.receiveAgentMessage
);

export default router;
