import { Router } from 'express';
import { analyzeSaju } from '../controllers/saju.controller';

const router = Router();

router.post('/analyze', analyzeSaju);

export default router;
