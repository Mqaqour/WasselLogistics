import { Router } from 'express';
import { customsCase } from '../controllers/customsCase.controller';

const router = Router();

router.get('/', customsCase);

export default router;
