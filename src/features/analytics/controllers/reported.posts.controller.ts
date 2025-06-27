import { NextFunction, Request, Response } from 'express';
import { validateUserGrowthQuery } from '../dto/user-growth-query.dto';
import { ReportedPostsService } from '../services/reported.posts.service';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';
import { BadRequestError } from '../../../utils/errors/api-error';

const reportedPostsService = new ReportedPostsService();

export const getReportedPostsController = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can access analytics'
      });
    }

    // Validate and parse query parameters using the same DTO as user growth
    const queryParams = await validateUserGrowthQuery(req.query);
    
    const data = await reportedPostsService.getReportedMetrics(
      queryParams.startDate!,
      queryParams.endDate!,
      queryParams.interval as 'daily' | 'weekly' | 'monthly'
    );
    
    // Return the response in the same format as user growth endpoint
    res.json({
      message: 'Reported posts statistics retrieved successfully',
      data: data
    });
  } catch (err: any) {
    // Handle BadRequestError from DTO validation
    if (err instanceof BadRequestError) {
      return res.status(400).json({
        message: 'Validation Error',
        details: err.details || [err.message],
      });
    }
    // Other server errors
    next(err);
  }
};