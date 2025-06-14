import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../../src/features/analytics/routes/analytics.routes';
import { ReportedPostsService } from '../../src/features/analytics/services/reported.posts.service';
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
        return res.status(400).json({ message: err.message });
      }
      if (err.status === 403) {
        return res.status(403).json({ message: 'Access denied' });
      }
      return res.status(500).json({ message: err.message || 'Internal server error' });
    });

    jest.clearAllMocks();
  });

  describe('GET /api/analytics/posts-stats/reported', () => {
    const mockData = {
      metrics: [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 }
      ],
      total: 8,
      aggregatedByInterval: 'daily' as const
    };

    it('should return reported posts data for admin users', async () => {
      // Mock service response
      (ReportedPostsService.prototype.getReportedMetrics as jest.Mock).mockResolvedValue(mockData);

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

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockData);
    });

    it('should deny access for non-admin users', async () => {
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
      // Mock service to throw validation error
      (ReportedPostsService.prototype.getReportedMetrics as jest.Mock).mockRejectedValue(
        new ValidationError('Invalid date format', 'endDate', 'endDate')
      );

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
      expect(response.body).toHaveProperty('message');
    });

    it('should handle service errors', async () => {
      // Mock service error
      (ReportedPostsService.prototype.getReportedMetrics as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

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

    it('should handle missing date parameters', async () => {
      // Mock service to throw validation error
      (ReportedPostsService.prototype.getReportedMetrics as jest.Mock).mockRejectedValue(
        new ValidationError('startDate is required', 'startDate', 'startDate')
      );

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
      expect(response.body).toHaveProperty('message');
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
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          range: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03',
          limit: 3
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('aggregatedByInterval', 'daily');
      expect(response.body).toHaveProperty('limit', 3);
    });

    it('should return 400 with invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          range: 'invalid',
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation Error');
    });

    it('should return 400 with missing required parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          range: 'daily'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation Error');
    });

    it('should handle different aggregation ranges', async () => {
      const ranges = ['daily', 'weekly', 'monthly'];
      
      for (const range of ranges) {
        const response = await request(app)
          .get('/api/analytics/posts-stats/top-interacted')
          .set('Authorization', 'Bearer token')
          .set('X-User-Role', 'admin')
          .set('X-User-Email', 'admin@test.com')
          .set('X-User-UUID', '123')
          .query({
            range,
            startDate: '2023-01-01',
            endDate: '2023-01-03'
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('aggregatedByInterval', range);
      }
    });

    it('should use default limit when not provided', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          range: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('limit', 3);
    });

    it('should handle date ranges spanning multiple periods', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'admin')
        .set('X-User-Email', 'admin@test.com')
        .set('X-User-UUID', '123')
        .query({
          range: 'weekly',
          startDate: '2023-01-01',
          endDate: '2023-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.metrics.length).toBeGreaterThan(1);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .set('Authorization', 'Bearer token')
        .set('X-User-Role', 'user')
        .set('X-User-Email', 'user@test.com')
        .set('X-User-UUID', '456')
        .query({
          range: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Access denied: Only administrators can view this metric.');
    });

    it('should return 401 when no authorization header is present', async () => {
      const response = await request(app)
        .get('/api/analytics/posts-stats/top-interacted')
        .query({
          range: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: 'No token provided' });
    });
  });
}); 