import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { validateBody } from '../middleware/validateRequest';
import { startChatLimiter, sendMessageLimiter } from '../middleware/rateLimiter';
import {
  startChatSchema,
  sendMessageSchema,
  closeSessionSchema,
} from '../validators/chat.validators';

const router = Router();

router.post('/start',
  startChatLimiter,
  validateBody(startChatSchema),
  chatController.startChat
);

router.post('/send',
  sendMessageLimiter,
  validateBody(sendMessageSchema),
  chatController.sendMessage
);

router.get('/messages/:sessionId', chatController.getMessages);

router.post('/close',
  validateBody(closeSessionSchema),
  chatController.closeSession
);

// Diagnostic — tests respond.io forwarding without touching real sessions
router.get('/debug/respondio', chatController.debugRespondIo);

export default router;
