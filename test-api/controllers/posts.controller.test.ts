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
    const mockServiceData = {
      aggregatedByInterval: 'daily',
      limit: 3,
      series: [
        {
          date: '2023-01-01',
          posts: [
            {
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
              commentCount: 5,
            },
          ],
        },
      ],
    };

    it('should return 403 if user is not admin', async () => {
      const mockRequest = {
        user: { role: 'user' },
        query: { startDate: '2023-01-01', endDate: '2023-01-31', interval: 'daily' },
      } as any;

      await getTopInteractedPostsController(mockRequest, mockResponse as Response, mockNext);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Only admins can access analytics'
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      const mockRequest = {
        user: { role: 'admin' },
        query: { startDate: 'invalid-date', endDate: '2023-01-31', interval: 'daily' },
      } as any;

      await getTopInteractedPostsController(mockRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockNext as jest.Mock).mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('should return 200 with data for valid request', async () => {
      mockRequest.query = {
        interval: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        limit: '3'
      };

      // Mock the service response
      (PostsService.prototype.getTopInteractedPosts as jest.Mock).mockResolvedValue(mockServiceData);

      await getTopInteractedPostsController(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Top interacted posts statistics retrieved successfully',
        data: mockServiceData
      });
    });

    it('should handle service errors', async () => {
      mockRequest.query = {
        interval: 'daily',
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

      expect(mockNext).toHaveBeenCalled();
      expect((mockNext as jest.Mock).mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('should use default limit when not provided', async () => {
      mockRequest.query = {
        interval: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03'
      };

      (PostsService.prototype.getTopInteractedPosts as jest.Mock).mockResolvedValue(mockServiceData);

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
          interval: range,
          startDate: '2023-01-01',
          endDate: '2023-01-03'
        };

        const mockData = { ...mockServiceData, aggregatedByInterval: range };
        (PostsService.prototype.getTopInteractedPosts as jest.Mock).mockResolvedValue(mockData);

        await getTopInteractedPostsController(
          mockRequest as any,
          mockResponse as Response,
          mockNext
        );

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({
          message: 'Top interacted posts statistics retrieved successfully',
          data: expect.objectContaining({
            aggregatedByInterval: range
          })
        });
      }
    });
  });
}); 