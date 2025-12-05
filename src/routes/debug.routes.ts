import { Router } from 'express';
import { debugAuth } from '../controllers/debug.controller';

const router = Router();

// Debug endpoint - REMOVE IN PRODUCTION
router.post('/auth', debugAuth);

export default router;
