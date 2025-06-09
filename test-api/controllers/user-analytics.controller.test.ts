import { Request, Response, NextFunction } from 'express';
import { UserAnalyticsController } from '../../src/features/analytics/controllers/user-analytics.controller';
import { UserAnalyticsService } from '../../src/features/analytics/services/user-analytics.service';
import { ForbiddenError } from '../../src/utils/errors/api-error';
import { AuthenticatedRequest } from '../../src/features/middleware/authenticate.middleware';

// Mock UserAnalyticsService
jest.mock('../../src/features/analytics/services/user-analytics.service');

describe('UserAnalyticsController', () => {
  let controller: UserAnalyticsController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh instances
    controller = new UserAnalyticsController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('getUserGrowthStats', () => {
    it('should return 200 with growth stats for admin users', async () => {
      // Mock authenticated request with admin role
      mockReq = {
        user: { role: 'admin' },
        query: {
          startDate: '2023-01-01',
          endDate: '2023-12-31',
          interval: 'monthly'
        }
      } as unknown as AuthenticatedRequest;

      // Mock service response
      const mockGrowthStats = {
        series: [],
        totalUsers: 100,
        totalActiveUsers: 50,
        aggregatedByInterval: 'monthly'
      };

      (UserAnalyticsService.prototype.getUserGrowthStats as jest.Mock)
        .mockResolvedValueOnce(mockGrowthStats);

      // Execute
      await controller.getUserGrowthStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User growth statistics retrieved successfully',
        data: mockGrowthStats
      });
    });

    it('should throw ForbiddenError for non-admin users', async () => {
      // Mock authenticated request with non-admin role
      mockReq = {
        user: { role: 'user' },
        query: {}
      } as unknown as AuthenticatedRequest;

      // Execute
      await controller.getUserGrowthStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assertions
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Only admins can access analytics'
      }));
    });

    it('should pass validation errors to error handler', async () => {
      // Mock authenticated request with admin role but invalid query
      mockReq = {
        user: { role: 'admin' },
        query: {
          startDate: 'invalid-date',  // Invalid date format
          endDate: '2023-13-45',     // Invalid date
          interval: 'yearly'          // Invalid interval
        }
      } as unknown as AuthenticatedRequest;

      // Execute
      await controller.getUserGrowthStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assertions
      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass service errors to error handler', async () => {
      // Mock authenticated request
      mockReq = {
        user: { role: 'admin' },
        query: {
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        }
      } as unknown as AuthenticatedRequest;

      // Mock service error
      const mockError = new Error('Service error');
      (UserAnalyticsService.prototype.getUserGrowthStats as jest.Mock)
        .mockRejectedValueOnce(mockError);

      // Execute
      await controller.getUserGrowthStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assertions
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});