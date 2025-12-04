import { Request, Response } from 'express';
import projectService from '../services/project.service';
import { 
  createProjectSchema, 
  updateProjectSchema,
  projectQuerySchema,
  createDeveloperSchema,
  updateDeveloperSchema,
  assignAmenitiesdSchema,
  uploadMediaSchema
} from '../middleware/validation/project.validation';

export class ProjectController {

  /**
   * Get projects with filters and pagination
   */
  async getProjects(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const { error, value } = projectQuerySchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const result = await projectService.getProjects(value);

      res.status(200).json({
        success: true,
        message: 'Projects retrieved successfully',
        data: result.projects,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getProjects:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve projects'
      });
    }
  }

  /**
   * Get single project by ID
   */
  async getProjectById(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      const project = await projectService.getProjectById(projectId);

      res.status(200).json({
        success: true,
        message: 'Project retrieved successfully',
        data: project
      });
    } catch (error: any) {
      console.error('Error in getProjectById:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve project'
      });
    }
  }

  /**
   * Create a new project
   */
  async createProject(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createProjectSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const createdBy = (req as any).user.id;
      const project = await projectService.createProject(value, createdBy);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
      });
    } catch (error: any) {
      console.error('Error in createProject:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create project'
      });
    }
  }

  /**
   * Update project
   */
  async updateProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateProjectSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const updatedBy = (req as any).user.id;
      const project = await projectService.updateProject(projectId, value, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project
      });
    } catch (error: any) {
      console.error('Error in updateProject:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update project'
      });
    }
  }

  /**
   * Delete project (soft delete)
   */
  async deleteProject(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      const deletedBy = (req as any).user.id;
      await projectService.deleteProject(projectId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deleteProject:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete project'
      });
    }
  }

  /**
   * Get project leads
   */
  async getProjectLeads(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await projectService.getProjectLeads(projectId, { page, limit });

      res.status(200).json({
        success: true,
        message: 'Project leads retrieved successfully',
        data: result.leads,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getProjectLeads:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve project leads'
      });
    }
  }

  /**
   * Get project deals
   */
  async getProjectDeals(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await projectService.getProjectDeals(projectId, { page, limit });

      res.status(200).json({
        success: true,
        message: 'Project deals retrieved successfully',
        data: result.deals,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getProjectDeals:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve project deals'
      });
    }
  }

  /**
   * Assign amenities to project
   */
  async assignAmenities(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = assignAmenitiesdSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const assignedBy = (req as any).user.id;
      const result = await projectService.assignAmenities(projectId, value.amenityIds, assignedBy);

      res.status(200).json({
        success: true,
        message: 'Amenities assigned successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error in assignAmenities:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to assign amenities'
      });
    }
  }

  /**
   * Remove amenity from project
   */
  async removeAmenity(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      const amenityId = parseInt(req.params.amenityId);
      
      if (isNaN(projectId) || isNaN(amenityId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID or amenity ID'
        });
        return;
      }

      const removedBy = (req as any).user.id;
      await projectService.removeAmenity(projectId, amenityId, removedBy);

      res.status(200).json({
        success: true,
        message: 'Amenity removed successfully'
      });
    } catch (error: any) {
      console.error('Error in removeAmenity:', error);
      const statusCode = error.message.includes('not found') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to remove amenity'
      });
    }
  }

  /**
   * Upload project media (images, brochures)
   */
  async uploadMedia(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      // Check if files were uploaded
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
        return;
      }

      const uploadedBy = (req as any).user.id;
      const mediaType = (req.body.mediaType as 'images' | 'brochure' | 'documents') || 'images';
      
      // Handle different file upload formats
      let files: Express.Multer.File[] = [];
      if (Array.isArray(req.files)) {
        files = req.files;
      } else if (req.files && typeof req.files === 'object') {
        // Handle multiple field uploads
        files = Object.values(req.files).flat();
      }
      
      const result = await projectService.uploadMedia(projectId, files, uploadedBy, mediaType);

      res.status(200).json({
        success: true,
        message: 'Media uploaded successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error in uploadMedia:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to upload media'
      });
    }
  }

  /**
   * Delete project media
   */
  async deleteMedia(req: Request, res: Response): Promise<void> {
    try {
      const projectId = parseInt(req.params.id);
      const mediaType = req.params.mediaType; // 'images' or 'brochure'
      const mediaIndex = req.query.index ? parseInt(req.query.index as string) : undefined;

      if (isNaN(projectId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid project ID'
        });
        return;
      }

      if (!['images', 'brochure'].includes(mediaType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid media type. Must be "images" or "brochure"'
        });
        return;
      }

      const deletedBy = (req as any).user.id;
      const result = await projectService.deleteMedia(projectId, mediaType, mediaIndex, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Media deleted successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error in deleteMedia:', error);
      const statusCode = error.message === 'Project not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete media'
      });
    }
  }

  // ===== DEVELOPER MANAGEMENT =====

  /**
   * Get all developers
   */
  async getDevelopers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

      const result = await projectService.getDevelopers({ page, limit, search, isActive });

      res.status(200).json({
        success: true,
        message: 'Developers retrieved successfully',
        data: result.developers,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getDevelopers:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve developers'
      });
    }
  }

  /**
   * Get developer by ID
   */
  async getDeveloperById(req: Request, res: Response): Promise<void> {
    try {
      const developerId = parseInt(req.params.id);
      if (isNaN(developerId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid developer ID'
        });
        return;
      }

      const developer = await projectService.getDeveloperById(developerId);

      res.status(200).json({
        success: true,
        message: 'Developer retrieved successfully',
        data: developer
      });
    } catch (error: any) {
      console.error('Error in getDeveloperById:', error);
      const statusCode = error.message === 'Developer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to retrieve developer'
      });
    }
  }

  /**
   * Create new developer
   */
  async createDeveloper(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const { error, value } = createDeveloperSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const createdBy = (req as any).user.id;
      const developer = await projectService.createDeveloper(value, createdBy);

      res.status(201).json({
        success: true,
        message: 'Developer created successfully',
        data: developer
      });
    } catch (error: any) {
      console.error('Error in createDeveloper:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create developer'
      });
    }
  }

  /**
   * Update developer
   */
  async updateDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const developerId = parseInt(req.params.id);
      if (isNaN(developerId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid developer ID'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateDeveloperSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => detail.message)
        });
        return;
      }

      const updatedBy = (req as any).user.id;
      const developer = await projectService.updateDeveloper(developerId, value, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Developer updated successfully',
        data: developer
      });
    } catch (error: any) {
      console.error('Error in updateDeveloper:', error);
      const statusCode = error.message === 'Developer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update developer'
      });
    }
  }

  /**
   * Delete developer
   */
  async deleteDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const developerId = parseInt(req.params.id);
      if (isNaN(developerId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid developer ID'
        });
        return;
      }

      const deletedBy = (req as any).user.id;
      await projectService.deleteDeveloper(developerId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Developer deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deleteDeveloper:', error);
      const statusCode = error.message === 'Developer not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete developer'
      });
    }
  }

  // ===== AMENITY MANAGEMENT =====

  /**
   * Get all amenities
   */
  async getAmenities(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50; // Higher default for amenities
      const search = req.query.search as string;
      const isActive = req.query.isActive ? req.query.isActive === 'true' : undefined;

      const result = await projectService.getAmenities({ page, limit, search, isActive });

      res.status(200).json({
        success: true,
        message: 'Amenities retrieved successfully',
        data: result.amenities,
        pagination: result.pagination
      });
    } catch (error: any) {
      console.error('Error in getAmenities:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve amenities'
      });
    }
  }

  /**
   * Create new amenity
   */
  async createAmenity(req: Request, res: Response): Promise<void> {
    try {
      const { name, icon } = req.body;
      
      if (!name || name.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Amenity name is required'
        });
        return;
      }

      const createdBy = (req as any).user.id;
      const amenity = await projectService.createAmenity({ name: name.trim(), icon }, createdBy);

      res.status(201).json({
        success: true,
        message: 'Amenity created successfully',
        data: amenity
      });
    } catch (error: any) {
      console.error('Error in createAmenity:', error);
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to create amenity'
        });
      }
    }
  }

  /**
   * Update amenity
   */
  async updateAmenity(req: Request, res: Response): Promise<void> {
    try {
      const amenityId = parseInt(req.params.id);
      if (isNaN(amenityId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid amenity ID'
        });
        return;
      }

      const { name, icon, isActive } = req.body;

      const updatedBy = (req as any).user.id;
      const amenity = await projectService.updateAmenity(amenityId, { name, icon, isActive }, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Amenity updated successfully',
        data: amenity
      });
    } catch (error: any) {
      console.error('Error in updateAmenity:', error);
      const statusCode = error.message === 'Amenity not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to update amenity'
      });
    }
  }

  /**
   * Delete amenity
   */
  async deleteAmenity(req: Request, res: Response): Promise<void> {
    try {
      const amenityId = parseInt(req.params.id);
      if (isNaN(amenityId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid amenity ID'
        });
        return;
      }

      const deletedBy = (req as any).user.id;
      await projectService.deleteAmenity(amenityId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Amenity deleted successfully'
      });
    } catch (error: any) {
      console.error('Error in deleteAmenity:', error);
      const statusCode = error.message === 'Amenity not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to delete amenity'
      });
    }
  }
}

export default new ProjectController();