import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest';
import { respondioMessageSchema } from '../validators/chat.validators';
import * as respondioController from '../controllers/respondio.controller';

const router = Router();

// Note: respond.io does not send an Authorization header to destination webhooks.
// Authentication is handled via channelId validation inside the controller.
router.post('/message',
  validateBody(respondioMessageSchema),
  respondioController.receiveAgentMessage
);

export default router;
