import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import projectController from '../controllers/project.controller';

const router = Router();

// All developer routes require authentication
router.use(authenticate);

// ===== DEVELOPER ROUTES =====
router.get('/', requirePermission('projects.view'), projectController.getDevelopers);
router.get('/:id', requirePermission('projects.view'), projectController.getDeveloperById);
router.post('/', requirePermission('projects.create'), projectController.createDeveloper);
router.put('/:id', requirePermission('projects.edit'), projectController.updateDeveloper);
router.delete('/:id', requirePermission('projects.delete'), projectController.deleteDeveloper);

export default router;