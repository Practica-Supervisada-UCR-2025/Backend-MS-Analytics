import request from 'supertest';
import express, { ErrorRequestHandler } from 'express';
import { errorHandler } from '../../src/utils/errors/error-handler.middleware';
import * as postStatsService from '../../src/features/analytics/services/postStats.service';
import postsRoutes from '../../src/features/analytics/routes/analytics.routes';

jest.mock('../../src/features/analytics/services/postStats.service');

jest.mock('../../src/features/middleware/authenticate.middleware.ts', () => {
  const { UnauthorizedError } = require('../../src/utils/errors/api-error');
  return {
    authenticateJWT: (req: any, res: any, next: any) => {
      const auth = req.headers.authorization;
      if (auth?.startsWith('Bearer valid-token')) {
        req.user = { uuid: 'user-uuid', email: 'user@test.com', role: 'user' };
        return next();
      }
      return next(new UnauthorizedError('Unauthorized'));
    },
  };
});

describe('GET /posts/stats/total → postStatsController', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/', postsRoutes);
    app.use(errorHandler as ErrorRequestHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse = {
    message: 'Analytics data fetched successfully',
    data: {
      series: [
        { date: '2025-W22', count: 4 },
        { date: '2025-W23', count: 8 },
      ],
      totalPosts: 12,
      aggregatedByInterval: 'weekly',
    },
  };

  it('returns 200 and correct data when query is valid', async () => {
    (postStatsService.getTotalPostsStatsService as jest.Mock).mockResolvedValueOnce(mockResponse);

    const res = await request(app)
      .get('/posts/stats/total')
      .set('Authorization', 'Bearer valid-token')
      .query({
        start_date: '01-06-2025', // ← formato que espera Zod (DD-MM-YYYY)
        end_date: '14-06-2025',
        period: 'weekly',
      })
      .expect(200);

    expect(res.body).toEqual(mockResponse);
    expect(postStatsService.getTotalPostsStatsService).toHaveBeenCalledWith({
      start_date: '2025-06-01', // ← lo que debe recibir el servicio tras transformación
      end_date: '2025-06-14',
      period: 'weekly',
    });
  });

  it('returns 500 if the service throws an error', async () => {
    (postStatsService.getTotalPostsStatsService as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

    const res = await request(app)
      .get('/posts/stats/total')
      .set('Authorization', 'Bearer valid-token')
      .query({
        start_date: '01-06-2025',
        end_date: '14-06-2025',
        period: 'weekly',
      })
      .expect(500);

    expect(res.body.message).toBe('Internal Server Error');
  });

  it('returns 400 when date format is invalid', async () => {
    const res = await request(app)
      .get('/posts/stats/total')
      .set('Authorization', 'Bearer valid-token')
      .query({
        start_date: '01/06/2025', // ← invalid format
        end_date: '14-06-2025',
        period: 'weekly',
      })
      .expect(400);

    expect(res.body.message).toBe('Invalid query parameters');
    expect(res.body.errors).toHaveProperty('start_date');
  });

  it('returns 400 when calendar date is invalid', async () => {
    const res = await request(app)
      .get('/posts/stats/total')
      .set('Authorization', 'Bearer valid-token')
      .query({
        start_date: '31-06-2025', // ← June only has 30 days
        end_date: '14-06-2025',
        period: 'weekly',
      })
      .expect(400);

    expect(res.body.message).toBe('Invalid query parameters');
    expect(res.body.errors).toHaveProperty('start_date');
  });

  it('returns 401 when no Authorization header', async () => {
    const res = await request(app)
      .get('/posts/stats/total')
      .expect(401);

    expect(res.body).toEqual({ message: 'Unauthorized' });
  });
});
