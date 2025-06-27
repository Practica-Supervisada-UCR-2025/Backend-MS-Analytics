import { Request, Response, NextFunction } from 'express';
import { UserAnalyticsService } from '../services/user-analytics.service';
import { validateUserGrowthQuery } from '../dto/user-growth-query.dto';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { ForbiddenError } from '../../../utils/errors/api-error';

export class UserAnalyticsController {
  private userAnalyticsService: UserAnalyticsService;
  
  constructor() {
    this.userAnalyticsService = new UserAnalyticsService();
  }
  
  async getUserGrowthStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== 'admin') {
        throw new ForbiddenError('Only admins can access analytics');
      }
      
      // Validate and parse query parameters - fixed the typo in await
      const queryParams = await validateUserGrowthQuery(req.query);
      
      // Get the data from service
      const growthStats = await this.userAnalyticsService.getUserGrowthStats(queryParams);
      
      // Return the response
      res.status(200).json({
        message: 'User growth statistics retrieved successfully',
        data: growthStats
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserGrowthStatsNonCumulative(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== 'admin') {
        throw new ForbiddenError('Only admins can access analytics');
      }
      
      // Validate and parse query parameters - fixed the typo in await
      const queryParams = await validateUserGrowthQuery(req.query);
      
      // Get the data from service
      const growthStats = await this.userAnalyticsService.getUserGrowthStatsNonCumulative(queryParams);
      
      // Return the response
      res.status(200).json({
        message: 'User growth statistics retrieved successfully',
        data: growthStats
      });
    } catch (error) {
      next(error);
    }
  }
}