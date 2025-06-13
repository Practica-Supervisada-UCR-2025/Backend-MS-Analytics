// src/controllers/postStats.controller.ts
import { Request, Response, NextFunction } from 'express';
import { statsQuerySchema } from '../dto/postStats.dto';
import { getTotalPostsStatsService } from '../services/postStats.service';

export const getTotalPostsStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = statsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Transformar DD-MM-YYYY → YYYY-MM-DD
    const [startDay, startMonth, startYear] = parsed.data.start_date.split('-');
    const [endDay, endMonth, endYear] = parsed.data.end_date.split('-');

    const transformedQuery = {
      ...parsed.data,
      start_date: `${startYear}-${startMonth}-${startDay}`,
      end_date: `${endYear}-${endMonth}-${endDay}`,
    };

    const result = await getTotalPostsStatsService(transformedQuery);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
