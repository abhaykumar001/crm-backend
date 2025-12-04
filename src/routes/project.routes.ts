import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware';
import { uploadMultiple, handleUploadError } from '../middleware/upload.middleware';
import projectController from '../controllers/project.controller';

const router = Router();

// All project routes require authentication
router.use(authenticate);

// ===== PROJECT ROUTES =====
router.get('/', requirePermission('projects.view'), projectController.getProjects);
router.get('/:id', requirePermission('projects.view'), projectController.getProjectById);
router.post('/', requirePermission('projects.create'), projectController.createProject);
router.put('/:id', requirePermission('projects.edit'), projectController.updateProject);
router.delete('/:id', requirePermission('projects.delete'), projectController.deleteProject);

// Project relationships
router.get('/:id/leads', requirePermission('projects.view'), projectController.getProjectLeads);
router.get('/:id/deals', requirePermission('projects.view'), projectController.getProjectDeals);

// Amenity management
router.post('/:id/amenities', requirePermission('projects.edit'), projectController.assignAmenities);
router.delete('/:id/amenities/:amenityId', requirePermission('projects.edit'), projectController.removeAmenity);

// Media management
router.post('/:id/media', 
  requirePermission('projects.edit'), 
  uploadMultiple('files', 10),
  handleUploadError,
  projectController.uploadMedia
);
router.delete('/:id/media/:mediaType', requirePermission('projects.edit'), projectController.deleteMedia);

export default router;
