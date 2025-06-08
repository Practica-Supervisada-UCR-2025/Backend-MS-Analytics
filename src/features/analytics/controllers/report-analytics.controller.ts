import { Request, Response, NextFunction } from 'express';
import { ReportAnalyticsService } from '../services/report-analytics.service';
import { validateReportVolumeQuery } from '../dto/report-volume-query.dto';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { ForbiddenError } from '../../../utils/errors/api-error';

export class ReportAnalyticsController {
  private reportAnalyticsService: ReportAnalyticsService;
  
  constructor() {
    this.reportAnalyticsService = new ReportAnalyticsService();
  }
  
  async getReportVolumeStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if user is admin
      const authReq = req as AuthenticatedRequest;
      if (authReq.user.role !== 'admin') {
        throw new ForbiddenError('Only admins can access analytics');
      }
      
      // Validate and parse query parameters
      const queryParams = await validateReportVolumeQuery(req.query);
      
      // Get the data from service
      const volumeStats = await this.reportAnalyticsService.getReportVolumeStats(queryParams);
      
      // Return the response
      res.status(200).json({
        message: 'Analytics data fetched successfully',
        data: volumeStats
      });
    } catch (error) {
      next(error);
    }
  }
}