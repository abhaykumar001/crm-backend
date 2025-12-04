import { Router } from 'express';
import campaignController from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Campaign statistics (must be before /:id routes)
router.get('/statistics', campaignController.getCampaignStatistics);
router.get('/international', campaignController.getInternationalCampaigns);
router.get('/performance/all', campaignController.getAllCampaignsPerformance);

// Campaign CRUD
router.get('/', campaignController.getAllCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.post('/', campaignController.createCampaign);
router.put('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

// Campaign performance
router.get('/:id/performance', campaignController.getCampaignPerformance);

// Campaign managers
router.get('/:id/managers', campaignController.getCampaignManagers);
router.post('/:id/managers', campaignController.addCampaignManager);
router.delete('/:id/managers/:userId', campaignController.removeCampaignManager);

export default router;
