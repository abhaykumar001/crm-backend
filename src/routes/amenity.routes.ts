import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import projectController from '../controllers/project.controller';

const router = Router();

// All amenity routes require authentication
router.use(authenticate);

// ===== AMENITY ROUTES =====
router.get('/', requirePermission('projects.view'), projectController.getAmenities);
router.post('/', requirePermission('projects.create'), projectController.createAmenity);
router.put('/:id', requirePermission('projects.edit'), projectController.updateAmenity);
router.delete('/:id', requirePermission('projects.delete'), projectController.deleteAmenity);

export default router;