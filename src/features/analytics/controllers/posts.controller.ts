// src/controllers/posts.controller.ts
import { NextFunction, Request, Response } from 'express';
import { validateUserGrowthQuery } from '../dto/user-growth-query.dto';
import { PostsService } from '../services/posts.service';
import { AuthenticatedRequest } from '../../middleware/authenticate.middleware';

const postsService = new PostsService();

export const getTopInteractedPostsController = async (
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

    // Get limit from query if provided, otherwise use default
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;

    // Call service with the validated parameters
    const data = await postsService.getTopInteractedPosts({
      range: queryParams.interval,
      startDate: queryParams.startDate!,
      endDate: queryParams.endDate!,
      limit: limit
    });

    // Return the response in the same format as user growth endpoint
    res.status(200).json({
      message: 'Top interacted posts statistics retrieved successfully',
      data: data
    });
  } catch (err: any) {
    // Handle Yup validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        details: err.errors,
      });
    }
    // Other server errors
    next(err);
  }
};