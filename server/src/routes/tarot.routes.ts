import { Router } from 'express';
import { drawCards, getAllCards } from '../controllers/tarot.controller';

const router = Router();

router.post('/draw', drawCards);
router.get('/cards', getAllCards);

export default router;
