import { Router } from 'express';
import * as controller from '../controllers/resource-sections.controller';

const router = Router();

router.get('/', controller.listSections);
router.post('/', controller.createSection);
router.patch('/:id', controller.updateSection);

export default router;
