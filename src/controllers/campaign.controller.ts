import { Request, Response, NextFunction } from 'express';
import campaignService from '../services/campaign.service';

class CampaignController {
  /**
   * Get all campaigns
   * GET /api/campaigns
   */
  async getAllCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, isInternational, startDate, endDate, search } = req.query;

      const filters: any = {};
      if (status !== undefined) filters.status = parseInt(status as string);
      if (isInternational !== undefined)
        filters.isInternational = isInternational === 'true';
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (search) filters.search = search as string;

      const campaigns = await campaignService.getAllCampaigns(filters);

      res.status(200).json({
        success: true,
        data: campaigns,
        count: campaigns.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single campaign
   * GET /api/campaigns/:id
   */
  async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const campaign = await campaignService.getCampaignById(parseInt(id));

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found',
        });
      }

      res.status(200).json({
        success: true,
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new campaign
   * POST /api/campaigns
   */
  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.createCampaign(req.body);

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update campaign
   * PUT /api/campaigns/:id
   */
  async updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const campaign = await campaignService.updateCampaign(
        parseInt(id),
        req.body
      );

      res.status(200).json({
        success: true,
        message: 'Campaign updated successfully',
        data: campaign,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete campaign
   * DELETE /api/campaigns/:id
   */
  async deleteCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await campaignService.deleteCampaign(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign performance
   * GET /api/campaigns/:id/performance
   */
  async getCampaignPerformance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const performance = await campaignService.getCampaignPerformance(
        parseInt(id),
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: performance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all campaigns performance
   * GET /api/campaigns/performance/all
   */
  async getAllCampaignsPerformance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { startDate, endDate } = req.query;

      const performance = await campaignService.getAllCampaignsPerformance(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: performance,
        count: performance.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add campaign manager
   * POST /api/campaigns/:id/managers
   */
  async addCampaignManager(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required',
        });
      }

      const manager = await campaignService.addCampaignManager(
        parseInt(id),
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Campaign manager added successfully',
        data: manager,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove campaign manager
   * DELETE /api/campaigns/:id/managers/:userId
   */
  async removeCampaignManager(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, userId } = req.params;

      await campaignService.removeCampaignManager(
        parseInt(id),
        parseInt(userId)
      );

      res.status(200).json({
        success: true,
        message: 'Campaign manager removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign managers
   * GET /api/campaigns/:id/managers
   */
  async getCampaignManagers(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const managers = await campaignService.getCampaignManagers(parseInt(id));

      res.status(200).json({
        success: true,
        data: managers,
        count: managers.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get international campaigns
   * GET /api/campaigns/international
   */
  async getInternationalCampaigns(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const campaigns = await campaignService.getInternationalCampaigns();

      res.status(200).json({
        success: true,
        data: campaigns,
        count: campaigns.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign statistics
   * GET /api/campaigns/statistics
   */
  async getCampaignStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const statistics = await campaignService.getCampaignStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CampaignController();
