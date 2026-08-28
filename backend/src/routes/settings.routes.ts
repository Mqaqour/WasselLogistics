import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

router.get('/notifications', settingsController.getNotifications);
router.put('/notifications', settingsController.updateNotifications);

export default router;
