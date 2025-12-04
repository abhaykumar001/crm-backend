import { Request, Response, NextFunction } from 'express';
import sourceService from '../services/source.service';

class SourceController {
  /**
   * Get all sources
   * GET /api/sources
   */
  async getAllSources(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, campaignId, isActive, isCroned, runAllTime, search } =
        req.query;

      const filters: any = {};
      if (type) filters.type = type as string;
      if (campaignId) filters.campaignId = parseInt(campaignId as string);
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (isCroned !== undefined) filters.isCroned = isCroned === 'true';
      if (runAllTime !== undefined) filters.runAllTime = runAllTime === 'true';
      if (search) filters.search = search as string;

      const sources = await sourceService.getAllSources(filters);

      res.status(200).json({
        success: true,
        data: sources,
        count: sources.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single source
   * GET /api/sources/:id
   */
  async getSourceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await sourceService.getSourceById(parseInt(id));

      if (!source) {
        return res.status(404).json({
          success: false,
          message: 'Source not found',
        });
      }

      res.status(200).json({
        success: true,
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new source
   * POST /api/sources
   */
  async createSource(req: Request, res: Response, next: NextFunction) {
    try {
      const source = await sourceService.createSource(req.body);

      res.status(201).json({
        success: true,
        message: 'Source created successfully',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update source
   * PUT /api/sources/:id
   */
  async updateSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const source = await sourceService.updateSource(parseInt(id), req.body);

      res.status(200).json({
        success: true,
        message: 'Source updated successfully',
        data: source,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete source
   * DELETE /api/sources/:id
   */
  async deleteSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await sourceService.deleteSource(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Source deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Configure agent pool for source
   * POST /api/sources/:id/agent-pool
   */
  async configureAgentPool(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { agentIds, rotationType } = req.body;

      if (!agentIds || !Array.isArray(agentIds)) {
        return res.status(400).json({
          success: false,
          message: 'agentIds array is required',
        });
      }

      const result = await sourceService.configureAgentPool({
        sourceId: parseInt(id),
        agentIds,
        rotationType,
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.agentPool,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add agent to source pool
   * POST /api/sources/:id/agents
   */
  async addAgentToPool(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required',
        });
      }

      const sourceUser = await sourceService.addAgentToPool(
        parseInt(id),
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Agent added to pool successfully',
        data: sourceUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove agent from source pool
   * DELETE /api/sources/:id/agents/:userId
   */
  async removeAgentFromPool(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, userId } = req.params;

      await sourceService.removeAgentFromPool(parseInt(id), parseInt(userId));

      res.status(200).json({
        success: true,
        message: 'Agent removed from pool successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get agent pool for source
   * GET /api/sources/:id/agent-pool
   */
  async getAgentPool(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const agentPool = await sourceService.getAgentPool(parseInt(id));

      res.status(200).json({
        success: true,
        data: agentPool,
        count: agentPool.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get next agent for round-robin
   * GET /api/sources/:id/next-agent
   */
  async getNextAgentForRoundRobin(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const agentId = await sourceService.getNextAgentForRoundRobin(
        parseInt(id)
      );

      if (!agentId) {
        return res.status(404).json({
          success: false,
          message: 'No available agents in source pool',
        });
      }

      res.status(200).json({
        success: true,
        data: { agentId },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get source statistics
   * GET /api/sources/:id/statistics
   */
  async getSourceStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const statistics = await sourceService.getSourceStatistics(
        parseInt(id),
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create sub-source
   * POST /api/sources/:id/sub-sources
   */
  async createSubSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'name is required',
        });
      }

      const subSource = await sourceService.createSubSource(parseInt(id), name);

      res.status(201).json({
        success: true,
        message: 'Sub-source created successfully',
        data: subSource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sub-sources for source
   * GET /api/sources/:id/sub-sources
   */
  async getSubSources(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const subSources = await sourceService.getSubSources(parseInt(id));

      res.status(200).json({
        success: true,
        data: subSources,
        count: subSources.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sub-source
   * PUT /api/sub-sources/:id
   */
  async updateSubSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const subSource = await sourceService.updateSubSource(
        parseInt(id),
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Sub-source updated successfully',
        data: subSource,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sources for auto-distribution
   * GET /api/sources/auto-distribution
   */
  async getSourcesForAutoDistribution(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const sources = await sourceService.getSourcesForAutoDistribution();

      res.status(200).json({
        success: true,
        data: sources,
        count: sources.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SourceController();
