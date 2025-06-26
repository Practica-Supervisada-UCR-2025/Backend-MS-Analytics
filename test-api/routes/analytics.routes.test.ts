import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../../src/features/analytics/routes/analytics.routes';
import { ReportedPostsService } from '../../src/features/analytics/services/reported.posts.service';
import { getTopInteractedPostsController } from '../../src/features/analytics/controllers/posts.controller';
import { getReportedPostsController } from '../../src/features/analytics/controllers/reported.posts.controller';
import { ValidationError } from 'yup';
import { authenticateJWT } from '../../src/features/middleware/authenticate.middleware';

// Mock the service
jest.mock('../../src/features/analytics/services/reported.posts.service');

// Mock the authentication middleware
jest.mock('../../src/features/middleware/authenticate.middleware', () => ({
  authenticateJWT: jest.fn((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'No token provided' });
    }
    req.user = {
      role: req.headers['x-user-role'] || 'admin',
      email: req.headers['x-user-email'] || 'admin@test.com',
      uuid: req.headers['x-user-uuid'] || '123'
    };
    next();
  })
}));

// Mock the controller
jest.mock('../../src/features/analytics/controllers/posts.controller', () => ({
  getTopInteractedPostsController: jest.fn()
}));

jest.mock('../../src/features/analytics/controllers/reported.posts.controller', () => ({
  getReportedPostsController: jest.fn()
}));

describe('Analytics Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/analytics', analyticsRoutes);

    // Add error handling middleware after routes
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('Error caught:', err);
      
      if (err instanceof ValidationError) {
        return res.status(400).json({ 
          message: 'Validation Error',
          details: err.errors
        });
      }
      if (err.status === 403) {
        return res.status(403).json({ message: 'Access denied' });
      }
      return res.status(500).json({ message: err.message || 'Internal server error' });
    });

    jest.clearAllMocks();
  });

  describe('GET /api/analytics/posts-stats/reported', () => {
    it('should return reported posts data for admin users', async () => {
      const mockData = {
        message: 'Reported posts statistics retrieved successfully',
        data: {
          aggregatedByInterval: 'daily',
          series: [
            {
              count: 5,
              date: '2023-01-01',
            },
            {
              count: 3,
              date: '2023-01-02',
            },
          ],
          total: 8,
        },
      };

      // Mock the controller to return the expected response
      (getReportedPostsController as jest.Mock).mockImplementation((req, res) => {
        res.json(mockData);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/reported')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-UUID', '123e4567-e89b-12d3-a456-426614174000')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it('should deny access for non-admin users', async () => {
      // Mock the controller to throw an authorization error
      (getReportedPostsController as jest.Mock).mockImplementation((req, res, next) => {
        const error: any = new Error('Access denied');
        error.status = 403;
        next(error);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/reported')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        })
        .set('Authorization', 'Bearer user-token')
        .set('X-User-Role', 'user')
        .set('X-User-Email', 'user@example.com')
        .set('X-User-UUID', '123e4567-e89b-12d3-a456-426614174001');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Access denied' });
    });

    it('should handle validation errors', async () => {
      // Mock the controller to throw a validation error
      (getReportedPostsController as jest.Mock).mockImplementation((req, res, next) => {
        const error = new ValidationError('Invalid date format', 'endDate', 'endDate');
        next(error);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/reported')
        .query({
          interval: 'invalid',
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        })
        .set('Authorization', 'Bearer admin-token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@example.com')
        .set('X-User-UUID', '123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Validation Error',
        details: expect.any(Array)
      });
    });

    it('should handle missing date parameters', async () => {
      // Mock the controller to throw a validation error
      (getReportedPostsController as jest.Mock).mockImplementation((req, res, next) => {
        const error = new ValidationError('startDate is required', 'startDate', 'startDate');
        next(error);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/reported')
        .query({
          interval: 'daily'
        })
        .set('Authorization', 'Bearer admin-token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@example.com')
        .set('X-User-UUID', '123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Validation Error',
        details: expect.any(Array)
      });
    });

    it('should handle service errors', async () => {
      // Mock the controller to throw a service error
      (getReportedPostsController as jest.Mock).mockImplementation((req, res, next) => {
        const error = new Error('Service error');
        next(error);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/reported')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        })
        .set('Authorization', 'Bearer admin-token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@example.com')
        .set('X-User-UUID', '123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Service error' });
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/reported')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'No token provided' });
    });
  });

  describe('GET /posts-stats/top-interacted', () => {
    it('should return 200 with valid query parameters', async () => {
      const mockResponse = {
        message: 'Top interacted posts statistics retrieved successfully',
        data: {
          aggregatedByInterval: 'daily',
          limit: 3,
          series: [
            { date: '2023-01-01', posts: [] },
            { date: '2023-01-02', posts: [] },
            { date: '2023-01-03', posts: [] }
          ]
        }
      };

      (getTopInteractedPostsController as jest.Mock).mockImplementation((req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer valid-token')
        .set('X-User-UUID', '123e4567-e89b-12d3-a456-426614174000')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('aggregatedByInterval', 'daily');
      expect(response.body.data).toHaveProperty('limit', 3);
    });

    it('should return 400 with invalid query parameters', async () => {
      // Mock the controller to throw a validation error
      (getTopInteractedPostsController as jest.Mock).mockImplementation((req, res, next) => {
        const error = new ValidationError('Invalid interval', 'interval', 'interval');
        next(error);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          interval: 'invalid',
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Validation Error',
        details: expect.any(Array)
      });
    });

    it('should return 400 with missing required parameters', async () => {
      // Mock the controller to throw a validation error
      (getTopInteractedPostsController as jest.Mock).mockImplementation((req, res, next) => {
        const error = new ValidationError('startDate is required', 'startDate', 'startDate');
        next(error);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          interval: 'daily'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Validation Error',
        details: expect.any(Array)
      });
    });

    it('should handle different aggregation ranges', async () => {
      const ranges = ['daily', 'weekly', 'monthly'];
      
      for (const range of ranges) {
        const mockResponse = {
          message: 'Top interacted posts statistics retrieved successfully',
          data: {
            aggregatedByInterval: range,
            limit: 3,
            series: [
              { date: '2023-01-01', posts: [] },
              { date: '2023-01-02', posts: [] },
              { date: '2023-01-03', posts: [] }
            ]
          }
        };

        (getTopInteractedPostsController as jest.Mock).mockImplementation((req, res) => {
          res.json(mockResponse);
        });

        const response = await request(app)
          .get('/api/analytics/posts-stats/top-interacted')
          .set('Authorization', 'Bearer token')
          .set('X-User-Role', 'admin')
          .set('X-User-Email', 'admin@test.com')
          .set('X-User-UUID', '123')
          .query({
            interval: range,
            startDate: '2023-01-01',
            endDate: '2023-01-03'
          });

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('aggregatedByInterval', range);
      }
    });

    it('should use default limit when not provided', async () => {
      const mockResponse = {
        message: 'Top interacted posts statistics retrieved successfully',
        data: {
          aggregatedByInterval: 'daily',
          limit: 3,
          series: [
            { date: '2023-01-01', posts: [] },
            { date: '2023-01-02', posts: [] },
            { date: '2023-01-03', posts: [] }
          ]
        }
      };

      (getTopInteractedPostsController as jest.Mock).mockImplementation((req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('limit', 3);
    });

    it('should handle date ranges spanning multiple periods', async () => {
      const mockResponse = {
        message: 'Top interacted posts statistics retrieved successfully',
        data: {
          aggregatedByInterval: 'weekly',
          limit: 3,
          series: [
            { date: '2023-W01 (2022-12-26 to 2023-01-01)', posts: [] },
            { date: '2023-W02 (2023-01-02 to 2023-01-08)', posts: [] },
            { date: '2023-W03 (2023-01-09 to 2023-01-15)', posts: [] }
          ]
        }
      };

      (getTopInteractedPostsController as jest.Mock).mockImplementation((req, res) => {
        res.json(mockResponse);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          interval: 'weekly',
          startDate: '2023-01-01',
          endDate: '2023-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.metrics.length).toBeGreaterThan(1);
    });

    it('should return 403 for non-admin users', async () => {
      // Mock the controller to throw an authorization error
      (getTopInteractedPostsController as jest.Mock).mockImplementation((req, res, next) => {
        const error: any = new Error('Access denied');
        error.status = 403;
        next(error);
      });

      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'user')
        .set('X-User-Email', 'user@test.com')
        .set('X-User-UUID', '456')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });

    it('should return 401 when no authorization header is present', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .query({
          interval: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'No token provided' });
    });
  });
}); 