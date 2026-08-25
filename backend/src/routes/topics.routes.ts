import { Router } from 'express';
import * as questionsController from '../controllers/questions.controller';

const router = Router();

router.get('/', questionsController.getTopics);
router.post('/', questionsController.createTopic);
router.get('/:id', questionsController.getTopicById);
router.patch('/:id', questionsController.patchTopic);
router.delete('/:id', questionsController.deleteTopic);

export default router;
