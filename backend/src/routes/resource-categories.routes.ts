import { Router } from 'express';
import * as controller from '../controllers/resource-categories.controller';

const router = Router();

router.get('/',    controller.listCategories);
router.post('/',   controller.createCategory);
router.patch('/:id', controller.updateCategory);
router.delete('/:id', controller.deleteCategory);

export default router;
