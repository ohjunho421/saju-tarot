import { Router } from 'express';
import { getIntegratedReading } from '../controllers/interpretation.controller';

const router = Router();

router.post('/integrated', getIntegratedReading);

export default router;
