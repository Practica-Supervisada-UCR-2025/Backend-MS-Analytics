import { getTopInteractedPostsMetrics } from '../../src/features/analytics/repositories/posts.repository';
import client from '../../src/config/database';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('Posts Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopInteractedPostsMetrics', () => {
    const mockQueryResult = {
      rows: [
        {
          date: '2023-01-01',
          posts: [
            {
              id: '1',
              userId: 'user1',
              content: 'Test post 1',
              createdAt: '2023-01-01T00:00:00.000Z',
              updatedAt: null,
              fileUrl: null,
              fileSize: null,
              mediaType: null,
              isActive: true,
              isEdited: false,
              status: 1,
              commentCount: 5
            }
          ]
        }
      ]
    };

    it('should return top posts for daily range', async () => {
      (client.query as jest.Mock).mockResolvedValue(mockQueryResult);

      const result = await getTopInteractedPostsMetrics(
        'daily',
        '2023-01-01',
        '2023-01-31',
        3
      );

      expect(result).toEqual(mockQueryResult.rows);
      expect(client.query).toHaveBeenCalledWith(
        expect.any(String),
        ['day', '2023-01-01', '2023-01-31', 'YYYY-MM-DD', '1 day', 3]
      );
    });

    it('should return top posts for weekly range', async () => {
      (client.query as jest.Mock).mockResolvedValue(mockQueryResult);

      const result = await getTopInteractedPostsMetrics(
        'weekly',
        '2023-01-01',
        '2023-01-31',
        3
      );

      expect(result).toEqual(mockQueryResult.rows);
      expect(client.query).toHaveBeenCalledWith(
        expect.any(String),
        ['week', '2023-01-01', '2023-01-31', 'IYYY-"W"IW', '1 week', 3]
      );
    });

    it('should return top posts for monthly range', async () => {
      (client.query as jest.Mock).mockResolvedValue(mockQueryResult);

      const result = await getTopInteractedPostsMetrics(
        'monthly',
        '2023-01-01',
        '2023-01-31',
        3
      );

      expect(result).toEqual(mockQueryResult.rows);
      expect(client.query).toHaveBeenCalledWith(
        expect.any(String),
        ['month', '2023-01-01', '2023-01-31', 'YYYY-MM', '1 month', 3]
      );
    });

    it('should handle empty results', async () => {
      (client.query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getTopInteractedPostsMetrics(
        'daily',
        '2023-01-01',
        '2023-01-31',
        3
      );

      expect(result).toEqual([]);
    });

    it('should handle posts with null values', async () => {
      const mockResultWithNulls = {
        rows: [
          {
            date: '2023-01-01',
            posts: [
              {
                id: '1',
                userId: 'user1',
                content: null,
                createdAt: '2023-01-01T00:00:00.000Z',
                updatedAt: null,
                fileUrl: null,
                fileSize: null,
                mediaType: null,
                isActive: true,
                isEdited: false,
                status: 1,
                commentCount: 5
              }
            ]
          }
        ]
      };

      (client.query as jest.Mock).mockResolvedValue(mockResultWithNulls);

      const result = await getTopInteractedPostsMetrics(
        'daily',
        '2023-01-01',
        '2023-01-31',
        3
      );

      expect(result).toEqual(mockResultWithNulls.rows);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      (client.query as jest.Mock).mockRejectedValue(error);

      await expect(
        getTopInteractedPostsMetrics('daily', '2023-01-01', '2023-01-31', 3)
      ).rejects.toThrow('Database error');
    });

    it('should parse commentCount as integer', async () => {
      const mockResultWithStringCount = {
        rows: [
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
                commentCount: '5' // String value
              }
            ]
          }
        ]
      };

      (client.query as jest.Mock).mockResolvedValue(mockResultWithStringCount);

      const result = await getTopInteractedPostsMetrics(
        'daily',
        '2023-01-01',
        '2023-01-31',
        3
      );

      expect(result[0].posts[0].commentCount).toBe(5); // Should be number
    });
  });
}); 