import { Router } from 'express';
import sourceController from '../controllers/source.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Auto-distribution sources (must be before /:id routes)
router.get('/auto-distribution', sourceController.getSourcesForAutoDistribution);

// Source CRUD
router.get('/', sourceController.getAllSources);
router.get('/:id', sourceController.getSourceById);
router.post('/', sourceController.createSource);
router.put('/:id', sourceController.updateSource);
router.delete('/:id', sourceController.deleteSource);

// Agent pool management
router.get('/:id/agent-pool', sourceController.getAgentPool);
router.post('/:id/agent-pool', sourceController.configureAgentPool);
router.post('/:id/agents', sourceController.addAgentToPool);
router.delete('/:id/agents/:userId', sourceController.removeAgentFromPool);

// Round-robin
router.get('/:id/next-agent', sourceController.getNextAgentForRoundRobin);

// Source statistics
router.get('/:id/statistics', sourceController.getSourceStatistics);

// Sub-sources
router.get('/:id/sub-sources', sourceController.getSubSources);
router.post('/:id/sub-sources', sourceController.createSubSource);
router.put('/sub-sources/:id', sourceController.updateSubSource);

export default router;
