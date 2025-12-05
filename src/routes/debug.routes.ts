import { Router } from 'express';
import { debugAuth, checkUsers } from '../controllers/debug.controller';

const router = Router();

// Debug endpoints - REMOVE IN PRODUCTION
router.get('/users', checkUsers);
router.post('/auth', debugAuth);

export default router;
