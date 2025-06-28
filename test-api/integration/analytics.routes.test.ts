import request from 'supertest';
import { app } from '../../src/app';
import client from '../../src/config/database';
import { JwtService } from '../../src/features/users/services/jwt.service';

// Mock database client
jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
}));

// Mock JWT service
const mockVerifyToken = jest.fn();
jest.mock('../../src/features/users/services/jwt.service', () => {
  return {
    JwtService: jest.fn().mockImplementation(() => ({
      verifyToken: mockVerifyToken
    }))
  };
});

describe('Analytics Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyToken.mockImplementation(() => ({
      role: 'admin',
      email: 'test@test.com',
      uuid: 'test-uuid'
    }));
  });

  describe('GET /api/analytics/users-stats/growth', () => {
    it('should return user growth statistics for authenticated admin', async () => {
      // Mock database responses
      (client.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '100' }] })              // getTotalUsers
        .mockResolvedValueOnce({ rows: [{ active: '50' }] })             // getTotalActiveUsers
        .mockResolvedValueOnce({                                          // getUserGrowthData
          rows: [
            { date: '2023-01-01', new_users: '5' },
            { date: '2023-01-02', new_users: '3' }
          ]
        });

      const response = await request(app)
        .get('/api/analytics/users-stats/growth')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: '2023-01-01',
          endDate: '2023-01-02',
          interval: 'daily'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'User growth statistics retrieved successfully',
        data: {
          series: [
            { date: '2023-01-01', count: 5 },
            { date: '2023-01-02', count: 8 }  // Cumulative: 5 + 3 = 8
          ],
          totalUsers: 100,
          totalActiveUsers: 50,
          aggregatedByInterval: 'daily'
        }
      });
    });

    it('should return 403 for non-admin users', async () => {
      mockVerifyToken.mockImplementation(() => ({
        role: 'user',
        email: 'test@test.com',
        uuid: 'test-uuid'
      }));

      const response = await request(app)
        .get('/api/analytics/users-stats/growth')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'Only admins can access analytics'
      });

    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/users-stats/growth');

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/users-stats/growth')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: 'invalid-date',
          endDate: '2023-13-45',
          interval: 'yearly'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Validation error',
        details: expect.any(Array)
      });

    });
  });

  describe('GET /api/analytics/reports-stats/volume', () => {
    it('should return report volume statistics for authenticated admin', async () => {
      // Mock database responses
      (client.query as jest.Mock)
        .mockResolvedValueOnce({                                          // getTotalReports
          rows: [{ total: '50' }]
        })
        .mockResolvedValueOnce({                                          // getTotalOverallReports
          rows: [{ total: '50' }]
        })
        .mockResolvedValueOnce({                                          // getReportVolumeData
          rows: [
            { date: '2023-01-01', report_count: '10' },
            { date: '2023-01-02', report_count: '15' }
          ]
        });

      const response = await request(app)
        .get('/api/analytics/reports-stats/volume')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: '2023-01-01',
          endDate: '2023-01-02',
          interval: 'daily'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Analytics data fetched successfully',
        data: {
          series: [
            { date: '2023-01-01', count: 10 },
            { date: '2023-01-02', count: 15 }
          ],
          total: 50,
          overallTotal: 50,
          aggregatedByInterval: 'daily'
        }
      });
    });

    it('should return 403 for non-admin users', async () => {
      mockVerifyToken.mockImplementation(() => ({
        role: 'user',
        email: 'test@test.com',
        uuid: 'test-uuid'
      }));

      const response = await request(app)
        .get('/api/analytics/reports-stats/volume')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'Only admins can access analytics'
      });

    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/reports-stats/volume');

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/reports-stats/volume')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: 'invalid-date',
          endDate: '2023-13-45',
          interval: 'yearly'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Validation error',
        details: expect.any(Array)
      });

    });

    it('should handle database errors gracefully', async () => {
      (client.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/analytics/reports-stats/volume')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: '2023-01-01',
          endDate: '2023-01-02',
          interval: 'daily'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'Failed to retrieve report volume statistics'
      });

    });
  });

  describe('GET /api/analytics/users-stats/growth/non-cumulative', () => {
    it('should return non-cumulative user growth statistics for authenticated admin', async () => {
      // Mock database responses
      (client.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ total: '100' }] })              // getTotalUsers
        .mockResolvedValueOnce({ rows: [{ active: '50' }] })             // getTotalActiveUsers
        .mockResolvedValueOnce({                                          // getUserGrowthData
          rows: [
            { date: '2023-01-01', new_users: '5' },
            { date: '2023-01-02', new_users: '3' }
          ]
        });

      const response = await request(app)
        .get('/api/analytics/users-stats/growth/non-cumulative')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: '2023-01-01',
          endDate: '2023-01-02',
          interval: 'daily'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'User growth statistics retrieved successfully',
        data: {
          series: [
            { date: '2023-01-01', count: 5 },
            { date: '2023-01-02', count: 3 }  // Non-cumulative: just the count for that day
          ],
          totalUsers: 100,
          totalActiveUsers: 50,
          aggregatedByInterval: 'daily'
        }
      });
    });

    it('should return 403 for non-admin users', async () => {
      mockVerifyToken.mockImplementation(() => ({
        role: 'user',
        email: 'test@test.com',
        uuid: 'test-uuid'
      }));

      const response = await request(app)
        .get('/api/analytics/users-stats/growth/non-cumulative')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: 'Only admins can access analytics'
      });
    });

    it('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/analytics/users-stats/growth/non-cumulative');

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/users-stats/growth/non-cumulative')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: 'invalid-date',
          endDate: '2023-13-45',
          interval: 'yearly'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Validation error',
        details: expect.any(Array)
      });
    });

    it('should handle database errors gracefully', async () => {
      (client.query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/analytics/users-stats/growth/non-cumulative')
        .set('Authorization', 'Bearer valid-token')
        .query({
          startDate: '2023-01-01',
          endDate: '2023-01-02',
          interval: 'daily'
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        message: 'Failed to retrieve user growth statistics'
      });
    });
  });
});