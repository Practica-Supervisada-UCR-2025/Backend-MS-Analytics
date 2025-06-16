import { Response, NextFunction } from 'express';
import { getTopInteractedPostsController } from '../../src/features/analytics/controllers/posts.controller';
import { PostsService } from '../../src/features/analytics/services/posts.service';
import { AuthenticatedRequest } from '../../src/features/middleware/authenticate.middleware';

// Mock the PostsService
jest.mock('../../src/features/analytics/services/posts.service');

describe('Posts Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
    mockNext = jest.fn();
    mockRequest = {
      query: {},
      user: { role: 'admin', email: 'admin@test.com', uuid: '123' }
    };
  });

  describe('getTopInteractedPostsController', () => {
    const mockServiceResponse = {
      metrics: [
        {
          date: '2023-01-01',
          posts: [{
            id: '1',
            userId: 'user1',
            content: 'Test post',
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: null,
            fileUrl: null,
            fileSize: null,
            mediaType: null,
            isActive: true,
            isEdited: false,
            status: 1,
            commentCount: 5
          }]
        }
      ],
      aggregatedByInterval: 'daily',
      limit: 3
    };

    it('should return 403 if user is not admin', async () => {
      mockRequest.user = { role: 'user', email: 'user@test.com', uuid: '456' };

      await getTopInteractedPostsController(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Access denied: Only administrators can view this metric.'
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      mockRequest.query = {
        range: 'invalid',
        startDate: 'invalid-date',
        endDate: 'invalid-date'
      };

      await getTopInteractedPostsController(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Validation Error',
        details: expect.any(Array)
      });
    });

    it('should return 200 with data for valid request', async () => {
      mockRequest.query = {
        range: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        limit: '3'
      };

      // Mock the service response
      (PostsService.prototype.getTopInteractedPosts as jest.Mock).mockResolvedValue(mockServiceResponse);

      await getTopInteractedPostsController(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockServiceResponse);
    });

    it('should handle service errors', async () => {
      mockRequest.query = {
        range: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03'
      };

      const error = new Error('Service error');
      (PostsService.prototype.getTopInteractedPosts as jest.Mock).mockRejectedValue(error);

      await getTopInteractedPostsController(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should use default limit when not provided', async () => {
      mockRequest.query = {
        range: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03'
      };

      (PostsService.prototype.getTopInteractedPosts as jest.Mock).mockResolvedValue(mockServiceResponse);

      await getTopInteractedPostsController(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(PostsService.prototype.getTopInteractedPosts).toHaveBeenCalledWith({
        range: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        limit: 3
      });
    });

    it('should handle different aggregation ranges', async () => {
      const ranges = ['daily', 'weekly', 'monthly'];
      
      for (const range of ranges) {
        mockRequest.query = {
          range,
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        };

        (PostsService.prototype.getTopInteractedPosts as jest.Mock).mockResolvedValue({
          ...mockServiceResponse,
          aggregatedByInterval: range
        });

        await getTopInteractedPostsController(
          mockRequest as any,
          mockResponse as Response,
          mockNext
        );

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
          aggregatedByInterval: range
        }));
      }
    });
  });
}); 