import { Router } from 'express';
import { generalTracking } from '../controllers/generalTracking.controller';

const router = Router();

router.get('/', generalTracking);
router.post('/', generalTracking);

export default router;
