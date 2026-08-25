import { Router } from 'express';
import * as controller from '../controllers/resource-sub-items.controller';

const router = Router();

router.get('/',      controller.listSubItems);
router.post('/',     controller.createSubItem);
router.patch('/:id', controller.updateSubItem);
router.delete('/:id', controller.deleteSubItem);

export default router;
