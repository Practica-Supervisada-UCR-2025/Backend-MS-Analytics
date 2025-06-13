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

    // Validate and get default values from schema
    const validatedData = await reportedPostsQuerySchema.validate(req.query, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    const data = await reportedPostsService.getReportedMetrics(
      validatedData.interval,
      validatedData.startDate,
      validatedData.endDate
    );
    
    res.json(data);
  } catch (err) {
    next(err);
  }
};