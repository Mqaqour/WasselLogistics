import { Router, Request, Response, NextFunction } from 'express';
import * as chatController from '../controllers/chat.controller';
import { validateBody } from '../middleware/validateRequest';
import { startChatLimiter, sendMessageLimiter, uploadAttachmentLimiter } from '../middleware/rateLimiter';
import { chatUpload } from '../utils/chatUploads';
import {
  startChatSchema,
  sendMessageSchema,
  closeSessionSchema,
} from '../validators/chat.validators';

const router = Router();

// Wraps multer so a bad/oversized/unsupported file returns 400 instead of
// falling through to the generic error handler as a 500.
function handleUpload(req: Request, res: Response, next: NextFunction) {
  chatUpload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload failed.';
      const code = message === 'UNSUPPORTED_FILE_TYPE' ? 'UNSUPPORTED_FILE_TYPE' : 'UPLOAD_ERROR';
      res.status(400).json({ error: { code, message } });
      return;
    }
    next();
  });
}

router.post('/upload',
  uploadAttachmentLimiter,
  handleUpload,
  chatController.uploadAttachment
);

router.get('/attachments/:filename', chatController.getAttachment);

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

// Diagnostic — must be above /messages/:sessionId so Express doesn't match 'debug' as a sessionId
router.get('/debug/respondio', chatController.debugRespondIo);

router.get('/messages/:sessionId', chatController.getMessages);

router.post('/close',
  validateBody(closeSessionSchema),
  chatController.closeSession
);

export default router;
