import { Request, Response, NextFunction } from 'express';
import { ReportAnalyticsController } from '../../src/features/analytics/controllers/report-analytics.controller';
import { ReportAnalyticsService } from '../../src/features/analytics/services/report-analytics.service';
import { ForbiddenError } from '../../src/utils/errors/api-error';
import { AuthenticatedRequest } from '../../src/features/middleware/authenticate.middleware';

// Mock ReportAnalyticsService
jest.mock('../../src/features/analytics/services/report-analytics.service');

describe('ReportAnalyticsController', () => {
  let controller: ReportAnalyticsController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh instances
    controller = new ReportAnalyticsController();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('getReportVolumeStats', () => {
    it('should return 200 with volume stats for admin users', async () => {
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
      const mockVolumeStats = {
        series: [
          { date: '2023-01', count: 10 },
          { date: '2023-02', count: 15 }
        ],
        totalReports: 25,
        aggregatedByInterval: 'monthly'
      };

      (ReportAnalyticsService.prototype.getReportVolumeStats as jest.Mock)
        .mockResolvedValueOnce(mockVolumeStats);

      // Execute
      await controller.getReportVolumeStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assertions
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Analytics data fetched successfully',
        data: mockVolumeStats
      });
    });

    it('should throw ForbiddenError for non-admin users', async () => {
      // Mock authenticated request with non-admin role
      mockReq = {
        user: { role: 'user' },
        query: {}
      } as unknown as AuthenticatedRequest;

      // Execute
      await controller.getReportVolumeStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assertions
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
          interval: 'quarterly'       // Invalid interval
        }
      } as unknown as AuthenticatedRequest;

      // Execute
      await controller.getReportVolumeStats(
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
          endDate: '2023-12-31',
          interval: 'monthly'
        }
      } as unknown as AuthenticatedRequest;

      // Mock service error
      const mockError = new Error('Service error');
      (ReportAnalyticsService.prototype.getReportVolumeStats as jest.Mock)
        .mockRejectedValueOnce(mockError);

      // Execute
      await controller.getReportVolumeStats(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assertions
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});