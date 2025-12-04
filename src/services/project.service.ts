import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ProjectFilters {
  page?: number;
  limit?: number;
  search?: string;
  developerId?: number;
  city?: string;
  state?: string;
  projectType?: string;
  status?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface DeveloperFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

interface AmenityFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

interface PaginationResult {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

class ProjectService {

  // ===== PROJECT MANAGEMENT =====

  /**
   * Get projects with filters and pagination
   */
  async getProjects(filters: ProjectFilters) {
    const {
      page = 1,
      limit = 10,
      search,
      developerId,
      city,
      state,
      projectType,
      status,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (developerId) {
      where.developerId = developerId;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (state) {
      where.state = { contains: state, mode: 'insensitive' };
    }

    if (projectType) {
      where.projectType = projectType;
    }

    if (status) {
      where.status = status;
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    try {
      // Get total count
      const totalCount = await prisma.project.count({ where });

      // Get projects
      const projects = await prisma.project.findMany({
        where,
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              logo: true,
              website: true
            }
          },
          amenities: {
            include: {
              amenity: {
                select: {
                  id: true,
                  name: true,
                  icon: true
                }
              }
            }
          },
          _count: {
            select: {
              leads: true,
              deals: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      });

      // Calculate pagination
      const totalPages = Math.ceil(totalCount / limit);
      const pagination: PaginationResult = {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return {
        projects: projects.map((project: any) => ({
          ...project,
          amenities: project.amenities.map((pa: any) => pa.amenity),
          leadsCount: project._count.leads,
          dealsCount: project._count.deals,
          _count: undefined // Remove the count object
        })),
        pagination
      };
    } catch (error) {
      console.error('Error in getProjects:', error);
      throw new Error('Failed to retrieve projects');
    }
  }

  /**
   * Get single project by ID
   */
  async getProjectById(id: number) {
    try {
      const project = await prisma.project.findFirst({
        where: { id, isActive: true },
        include: {
          developer: true,
          amenities: {
            include: {
              amenity: true
            }
          },
          _count: {
            select: {
              leads: true,
              deals: true
            }
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      return {
        ...project,
        amenities: (project as any).amenities.map((pa: any) => pa.amenity),
        leadsCount: (project as any)._count.leads,
        dealsCount: (project as any)._count.deals,
        _count: undefined
      };
    } catch (error: any) {
      console.error('Error in getProjectById:', error);
      throw new Error(error.message || 'Failed to retrieve project');
    }
  }

  /**
   * Create a new project (simplified for actual schema)
   */
  async createProject(projectData: any, createdBy: number) {
    try {
      // Verify developer exists if provided
      if (projectData.developerId) {
        const developer = await prisma.developer.findFirst({
          where: { id: projectData.developerId, isActive: true }
        });

        if (!developer) {
          throw new Error('Developer not found');
        }
      }

      // Create project with only fields that exist in schema
      const project = await prisma.project.create({
        data: {
          name: projectData.name,
          description: projectData.description,
          developerId: projectData.developerId,
          location: projectData.location,
          city: projectData.city,
          state: projectData.state,
          pincode: projectData.pincode,
          projectType: projectData.projectType,
          status: projectData.status || 'active',
          launchDate: projectData.launchDate,
          completionDate: projectData.completionDate,
          minPrice: projectData.minPrice,
          maxPrice: projectData.maxPrice
        },
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              logo: true
            }
          }
        }
      });

      return project;
    } catch (error: any) {
      console.error('Error in createProject:', error);
      throw new Error(error.message || 'Failed to create project');
    }
  }

  /**
   * Update project
   */
  async updateProject(id: number, updateData: any, updatedBy: number) {
    try {
      // Check if project exists
      const existingProject = await prisma.project.findFirst({
        where: { id, isActive: true }
      });

      if (!existingProject) {
        throw new Error('Project not found');
      }

      // If developerId is being updated, verify the new developer exists
      if (updateData.developerId) {
        const developer = await prisma.developer.findFirst({
          where: { id: updateData.developerId, isActive: true }
        });

        if (!developer) {
          throw new Error('Developer not found');
        }
      }

      // Update project with only valid fields
      const validFields: any = {};
      const allowedFields = ['name', 'description', 'developerId', 'location', 'city', 
                            'state', 'pincode', 'projectType', 'status', 'launchDate', 
                            'completionDate', 'minPrice', 'maxPrice', 'images', 'brochure'];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          validFields[field] = updateData[field];
        }
      }

      const project = await prisma.project.update({
        where: { id },
        data: validFields,
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              logo: true
            }
          },
          amenities: {
            include: {
              amenity: {
                select: {
                  id: true,
                  name: true,
                  icon: true
                }
              }
            }
          }
        }
      });

      return {
        ...project,
        amenities: (project as any).amenities.map((pa: any) => pa.amenity)
      };
    } catch (error: any) {
      console.error('Error in updateProject:', error);
      throw new Error(error.message || 'Failed to update project');
    }
  }

  /**
   * Delete project (soft delete)
   */
  async deleteProject(id: number, deletedBy: number) {
    try {
      // Check if project exists
      const project = await prisma.project.findFirst({
        where: { id, isActive: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Check for active leads/deals
      const activeLeads = await prisma.lead.count({
        where: { projectId: id, isActive: true }
      });

      const activeDeals = await prisma.deal.count({
        where: { projectId: id, isActive: true }
      });

      if (activeLeads > 0 || activeDeals > 0) {
        throw new Error('Cannot delete project with active leads or deals');
      }

      // Soft delete
      await prisma.project.update({
        where: { id },
        data: {
          isActive: false
        }
      });

      return true;
    } catch (error: any) {
      console.error('Error in deleteProject:', error);
      throw new Error(error.message || 'Failed to delete project');
    }
  }

  /**
   * Get project leads (simplified)
   */
  async getProjectLeads(projectId: number, options: { page: number; limit: number }) {
    try {
      // Verify project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, isActive: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const { page, limit } = options;
      const skip = (page - 1) * limit;

      // Get total count
      const totalCount = await prisma.lead.count({
        where: { projectId, isActive: true }
      });

      // Get leads with available fields
      const leads = await prisma.lead.findMany({
        where: { projectId, isActive: true },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const totalPages = Math.ceil(totalCount / limit);
      const pagination: PaginationResult = {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return { leads, pagination };
    } catch (error: any) {
      console.error('Error in getProjectLeads:', error);
      throw new Error(error.message || 'Failed to retrieve project leads');
    }
  }

  /**
   * Get project deals (simplified)
   */
  async getProjectDeals(projectId: number, options: { page: number; limit: number }) {
    try {
      // Verify project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, isActive: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const { page, limit } = options;
      const skip = (page - 1) * limit;

      // Get total count
      const totalCount = await prisma.deal.count({
        where: { projectId, isActive: true }
      });

      // Get deals
      const deals = await prisma.deal.findMany({
        where: { projectId, isActive: true },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const totalPages = Math.ceil(totalCount / limit);
      const pagination: PaginationResult = {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return { deals, pagination };
    } catch (error: any) {
      console.error('Error in getProjectDeals:', error);
      throw new Error(error.message || 'Failed to retrieve project deals');
    }
  }

  /**
   * Assign amenities to project (simplified)
   */
  async assignAmenities(projectId: number, amenityIds: number[], assignedBy: number) {
    try {
      // Verify project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, isActive: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Verify all amenities exist
      const amenities = await prisma.amenity.findMany({
        where: { id: { in: amenityIds }, isActive: true }
      });

      if (amenities.length !== amenityIds.length) {
        throw new Error('One or more amenities not found');
      }

      // Remove existing amenity assignments
      await prisma.projectAmenity.deleteMany({
        where: { projectId }
      });

      // Create new assignments
      const projectAmenities = amenityIds.map(amenityId => ({
        projectId,
        amenityId
      }));

      await prisma.projectAmenity.createMany({
        data: projectAmenities
      });

      // Return updated project with amenities
      const updatedProject = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          amenities: {
            include: {
              amenity: true
            }
          }
        }
      });

      return {
        project: updatedProject,
        amenities: (updatedProject as any)?.amenities.map((pa: any) => pa.amenity) || []
      };
    } catch (error: any) {
      console.error('Error in assignAmenities:', error);
      throw new Error(error.message || 'Failed to assign amenities');
    }
  }

  /**
   * Remove amenity from project (simplified)
   */
  async removeAmenity(projectId: number, amenityId: number, removedBy: number) {
    try {
      // Verify project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, isActive: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Find and delete the project amenity assignment
      const result = await prisma.projectAmenity.deleteMany({
        where: { projectId, amenityId }
      });

      if (result.count === 0) {
        throw new Error('Amenity assignment not found');
      }

      return true;
    } catch (error: any) {
      console.error('Error in removeAmenity:', error);
      throw new Error(error.message || 'Failed to remove amenity');
    }
  }

  /**
   * Upload project media
   */
  async uploadMedia(projectId: number, files: Express.Multer.File[], uploadedBy: number, mediaType: 'images' | 'brochure' | 'documents' = 'images') {
    try {
      // Verify project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, isActive: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const uploadedFiles = files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));

      // Update project based on media type
      let updateData: any = {};
      
      if (mediaType === 'images') {
        // Handle multiple images
        const currentImages = project.images ? JSON.parse(project.images) : [];
        const newImageFilenames = files.map(f => f.filename);
        const updatedImages = [...currentImages, ...newImageFilenames];
        updateData.images = JSON.stringify(updatedImages);
      } else if (mediaType === 'brochure') {
        // Handle single brochure file
        if (files.length > 0) {
          updateData.brochure = files[0].filename;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: updateData
        });
      }

      return {
        uploadedFiles,
        totalFiles: uploadedFiles.length,
        mediaType
      };
    } catch (error: any) {
      console.error('Error in uploadMedia:', error);
      throw new Error(error.message || 'Failed to upload media');
    }
  }

  /**
   * Delete project media
   */
  async deleteMedia(projectId: number, mediaType: string, mediaIndex?: number, deletedBy?: number) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Verify project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, isActive: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      let updatedProject;

      if (mediaType === 'images' && mediaIndex !== undefined) {
        const currentImages = project.images ? JSON.parse(project.images) : [];
        
        if (mediaIndex >= 0 && mediaIndex < currentImages.length) {
          // Remove file from filesystem
          const fileName = currentImages[mediaIndex];
          const filePath = path.join(process.cwd(), 'uploads', 'projects', projectId.toString(), fileName);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          // Remove from array
          currentImages.splice(mediaIndex, 1);

          updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
              images: JSON.stringify(currentImages)
            }
          });
        } else {
          throw new Error('Invalid image index');
        }
      } else if (mediaType === 'brochure') {
        // Remove brochure file
        if (project.brochure) {
          const filePath = path.join(process.cwd(), 'uploads', 'projects', projectId.toString(), project.brochure);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        updatedProject = await prisma.project.update({
          where: { id: projectId },
          data: {
            brochure: null
          }
        });
      }

      return updatedProject;
    } catch (error: any) {
      console.error('Error in deleteMedia:', error);
      throw new Error(error.message || 'Failed to delete media');
    }
  }

  // ===== DEVELOPER MANAGEMENT =====

  /**
   * Get developers with filters and pagination
   */
  async getDevelopers(filters: DeveloperFilters) {
    const { page = 1, limit = 10, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    try {
      const totalCount = await prisma.developer.count({ where });

      const developers = await prisma.developer.findMany({
        where,
        include: {
          _count: {
            select: {
              projects: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const totalPages = Math.ceil(totalCount / limit);
      const pagination: PaginationResult = {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return {
        developers: developers.map((dev: any) => ({
          ...dev,
          projectsCount: dev._count.projects,
          _count: undefined
        })),
        pagination
      };
    } catch (error) {
      console.error('Error in getDevelopers:', error);
      throw new Error('Failed to retrieve developers');
    }
  }

  /**
   * Get developer by ID
   */
  async getDeveloperById(id: number) {
    try {
      const developer = await prisma.developer.findFirst({
        where: { id, isActive: true },
        include: {
          projects: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          _count: {
            select: {
              projects: true
            }
          }
        }
      });

      if (!developer) {
        throw new Error('Developer not found');
      }

      return {
        ...developer,
        projectsCount: (developer as any)._count.projects,
        _count: undefined
      };
    } catch (error: any) {
      console.error('Error in getDeveloperById:', error);
      throw new Error(error.message || 'Failed to retrieve developer');
    }
  }

  /**
   * Create new developer
   */
  async createDeveloper(developerData: any, createdBy: number) {
    try {
      const developer = await prisma.developer.create({
        data: {
          name: developerData.name,
          description: developerData.description,
          contactInfo: developerData.contactInfo,
          logo: developerData.logo,
          website: developerData.website
        }
      });

      return developer;
    } catch (error: any) {
      console.error('Error in createDeveloper:', error);
      throw new Error(error.message || 'Failed to create developer');
    }
  }

  /**
   * Update developer
   */
  async updateDeveloper(id: number, updateData: any, updatedBy: number) {
    try {
      const existingDeveloper = await prisma.developer.findFirst({
        where: { id, isActive: true }
      });

      if (!existingDeveloper) {
        throw new Error('Developer not found');
      }

      const validFields: any = {};
      const allowedFields = ['name', 'description', 'contactInfo', 'logo', 'website', 'isActive'];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          validFields[field] = updateData[field];
        }
      }

      const developer = await prisma.developer.update({
        where: { id },
        data: validFields
      });

      return developer;
    } catch (error: any) {
      console.error('Error in updateDeveloper:', error);
      throw new Error(error.message || 'Failed to update developer');
    }
  }

  /**
   * Delete developer (soft delete)
   */
  async deleteDeveloper(id: number, deletedBy: number) {
    try {
      const developer = await prisma.developer.findFirst({
        where: { id, isActive: true }
      });

      if (!developer) {
        throw new Error('Developer not found');
      }

      // Check for active projects
      const activeProjects = await prisma.project.count({
        where: { developerId: id, isActive: true }
      });

      if (activeProjects > 0) {
        throw new Error('Cannot delete developer with active projects');
      }

      await prisma.developer.update({
        where: { id },
        data: {
          isActive: false
        }
      });

      return true;
    } catch (error: any) {
      console.error('Error in deleteDeveloper:', error);
      throw new Error(error.message || 'Failed to delete developer');
    }
  }

  // ===== AMENITY MANAGEMENT =====

  /**
   * Get amenities with filters and pagination
   */
  async getAmenities(filters: AmenityFilters) {
    const { page = 1, limit = 50, search, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    try {
      const totalCount = await prisma.amenity.count({ where });

      const amenities = await prisma.amenity.findMany({
        where,
        include: {
          _count: {
            select: {
              projects: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      });

      const totalPages = Math.ceil(totalCount / limit);
      const pagination: PaginationResult = {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      };

      return {
        amenities: amenities.map((amenity: any) => ({
          ...amenity,
          usageCount: amenity._count.projects,
          _count: undefined
        })),
        pagination
      };
    } catch (error) {
      console.error('Error in getAmenities:', error);
      throw new Error('Failed to retrieve amenities');
    }
  }

  /**
   * Create new amenity
   */
  async createAmenity(amenityData: { name: string; icon?: string }, createdBy: number) {
    try {
      // Check for duplicate name
      const existingAmenity = await prisma.amenity.findFirst({
        where: { 
          name: { equals: amenityData.name, mode: 'insensitive' },
          isActive: true 
        }
      });

      if (existingAmenity) {
        throw new Error(`Amenity with name "${amenityData.name}" already exists`);
      }

      const amenity = await prisma.amenity.create({
        data: {
          name: amenityData.name,
          icon: amenityData.icon
        }
      });

      return amenity;
    } catch (error: any) {
      console.error('Error in createAmenity:', error);
      throw new Error(error.message || 'Failed to create amenity');
    }
  }

  /**
   * Update amenity
   */
  async updateAmenity(id: number, updateData: any, updatedBy: number) {
    try {
      const existingAmenity = await prisma.amenity.findFirst({
        where: { id, isActive: true }
      });

      if (!existingAmenity) {
        throw new Error('Amenity not found');
      }

      // Check for duplicate name if name is being updated
      if (updateData.name && updateData.name !== existingAmenity.name) {
        const duplicateAmenity = await prisma.amenity.findFirst({
          where: { 
            name: { equals: updateData.name, mode: 'insensitive' },
            isActive: true,
            id: { not: id }
          }
        });

        if (duplicateAmenity) {
          throw new Error(`Amenity with name "${updateData.name}" already exists`);
        }
      }

      const validFields: any = {};
      const allowedFields = ['name', 'icon', 'isActive'];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          validFields[field] = updateData[field];
        }
      }

      const amenity = await prisma.amenity.update({
        where: { id },
        data: validFields
      });

      return amenity;
    } catch (error: any) {
      console.error('Error in updateAmenity:', error);
      throw new Error(error.message || 'Failed to update amenity');
    }
  }

  /**
   * Delete amenity (soft delete)
   */
  async deleteAmenity(id: number, deletedBy: number) {
    try {
      const amenity = await prisma.amenity.findFirst({
        where: { id, isActive: true }
      });

      if (!amenity) {
        throw new Error('Amenity not found');
      }

      // Check if amenity is being used in any active projects
      const activeUsage = await prisma.projectAmenity.count({
        where: { amenityId: id }
      });

      if (activeUsage > 0) {
        throw new Error('Cannot delete amenity that is assigned to active projects');
      }

      await prisma.amenity.update({
        where: { id },
        data: {
          isActive: false
        }
      });

      return true;
    } catch (error: any) {
      console.error('Error in deleteAmenity:', error);
      throw new Error(error.message || 'Failed to delete amenity');
    }
  }
}

export default new ProjectService();