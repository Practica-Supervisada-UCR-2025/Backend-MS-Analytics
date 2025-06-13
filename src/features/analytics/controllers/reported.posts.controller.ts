import { NextFunction, Request, Response } from 'express';
import { reportedPostsQuerySchema } from '../dto/reported.posts.dto';
import { ReportedPostsService } from '../services/reported.posts.service';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';

const reportedPostsService = new ReportedPostsService();

export const getReportedPostsController = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { interval, startDate, endDate } = await reportedPostsQuerySchema.validate(req.query, { abortEarly: false });
    
    // Pass validated parameters directly to the service, let the service handle its own defaults if needed
    const data = await reportedPostsService.getReportedMetrics(interval, startDate!, endDate!);
    res.json(data);
  } catch (err) {
    next(err);
  }
};