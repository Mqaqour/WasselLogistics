import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

// Authenticator-app (TOTP) enrolment — all require an active session.
router.post('/totp/setup', requireAuth, authController.totpSetup);
router.post('/totp/confirm', requireAuth, authController.totpConfirm);
router.post('/totp/disable', requireAuth, authController.totpDisable);

export default router;
