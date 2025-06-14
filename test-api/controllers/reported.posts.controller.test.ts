import { NextFunction, Request, Response } from 'express';
import { getReportedPostsController } from '../../src/features/analytics/controllers/reported.posts.controller';
import { ReportedPostsService } from '../../src/features/analytics/services/reported.posts.service';
import { AuthenticatedRequest } from '../../src/features/middleware/authenticate.middleware';
import { ValidationError } from 'yup';

// Mock the service
jest.mock('../../src/features/analytics/services/reported.posts.service');

describe('ReportedPostsController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      query: {},
      user: { 
        role: 'admin',
        email: 'admin@example.com',
        uuid: '123e4567-e89b-12d3-a456-426614174000'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('getReportedPostsController', () => {
    const mockData = {
      metrics: [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 }
      ],
      total: 8,
      aggregatedByInterval: 'daily' as const
    };

    it('should return data for admin users', async () => {
      // Mock service response
      (ReportedPostsService.prototype.getReportedMetrics as jest.Mock).mockResolvedValue(mockData);

      mockRequest.query = {
        interval: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      await getReportedPostsController(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin users', async () => {
      mockRequest.user = { 
        role: 'user',
        email: 'user@example.com',
        uuid: '123e4567-e89b-12d3-a456-426614174001'
      };

      await getReportedPostsController(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      mockRequest.query = {
        interval: 'invalid',
        startDate: 'invalid-date',
        endDate: 'invalid-date'
      };

      await getReportedPostsController(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      (ReportedPostsService.prototype.getReportedMetrics as jest.Mock).mockRejectedValue(error);

      mockRequest.query = {
        interval: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      await getReportedPostsController(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalledWith(error);
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle missing interval parameter', async () => {
      // Mock service response for default interval
      (ReportedPostsService.prototype.getReportedMetrics as jest.Mock).mockResolvedValue(mockData);

      mockRequest.query = {
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      await getReportedPostsController(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
      expect(nextFunction).not.toHaveBeenCalled();

      // Verify service was called with default interval
      expect(ReportedPostsService.prototype.getReportedMetrics).toHaveBeenCalledWith(
        'daily', // default interval
        '2023-01-01',
        '2023-01-31'
      );
    });
  });
}); 