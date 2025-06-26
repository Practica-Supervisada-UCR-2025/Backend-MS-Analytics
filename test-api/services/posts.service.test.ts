import { PostsService } from '../../src/features/analytics/services/posts.service';
import { getTopInteractedPostsMetrics } from '../../src/features/analytics/repositories/posts.repository';

// Mock the repository
jest.mock('../../src/features/analytics/repositories/posts.repository', () => ({
  getTopInteractedPostsMetrics: jest.fn()
}));

describe('Posts Service', () => {
  let service: PostsService;

  beforeEach(() => {
    service = new PostsService();
    jest.clearAllMocks();
  });

  describe('getTopInteractedPosts', () => {
    const mockPostDetail = {
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
    };

    const mockDailyResponse = [
      {
        date: '2023-01-01',
        posts: [mockPostDetail]
      }
    ];

    it('should return top posts with daily aggregation', async () => {
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue(mockDailyResponse);

      const result = await service.getTopInteractedPosts({
        range: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        limit: 3
      });

      expect(result).toEqual({
        series: [
          { date: '2023-01-01', posts: [mockPostDetail] },
          { date: '2023-01-02', posts: [] },
          { date: '2023-01-03', posts: [] }
        ],
        aggregatedByInterval: 'daily',
        limit: 3
      });

      expect(getTopInteractedPostsMetrics).toHaveBeenCalledWith(
        'daily',
        '2023-01-01',
        '2023-01-03',
        3
      );
    });

    it('should return top posts with weekly aggregation', async () => {
      // Mock the repository to return data with the correct period key: '2023-W01'
      // '2023-01-02' (Monday, Jan 2, 2023) falls into ISO Week 1 of 2023.
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue([
        {
          date: '2023-W01', // Correct format that the repository returns
          posts: [mockPostDetail]
        }
      ]);

      const result = await service.getTopInteractedPosts({
        range: 'weekly',
        startDate: '2023-01-02', // Monday
        endDate: '2023-01-08', // Sunday
        limit: 3
      });

      // Verify the response structure
      expect(result.aggregatedByInterval).toBe('weekly');
      expect(result.limit).toBe(3);
      expect(result.series.length).toBeGreaterThan(0);
      expect(result.series[0].date).toMatch(/^2023-W\d{2} \(\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}\)/);
      expect(result.series[0].posts).toEqual([mockPostDetail]);
    });

    it('should return top posts with monthly aggregation', async () => {
      // Mock the repository to return data with the correct period key: 'YYYY-MM'
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue([
        {
          date: '2023-01', // Corrected format for monthly period key
          posts: [mockPostDetail]
        }
      ]);

      const result = await service.getTopInteractedPosts({
        range: 'monthly',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        limit: 3
      });

      // Verify the response structure
      expect(result.aggregatedByInterval).toBe('monthly');
      expect(result.limit).toBe(3);
      expect(result.series.length).toBeGreaterThan(0);
      expect(result.series[0].date).toMatch(/^\d{4}-\d{2} \(\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}\)/);
      expect(result.series[0].posts).toEqual([mockPostDetail]);
    });

    it('should handle empty repository response', async () => {
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue([]);

      const result = await service.getTopInteractedPosts({
        range: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        limit: 3
      });

      expect(result.series).toHaveLength(3);
      expect(result.series.every(m => m.posts.length === 0)).toBe(true);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Repository error');
      (getTopInteractedPostsMetrics as jest.Mock).mockRejectedValue(error);

      await expect(
        service.getTopInteractedPosts({
          range: 'daily',
          startDate: '2023-01-01',
          endDate: '2023-01-03',
          limit: 3
        })
      ).rejects.toThrow('Repository error');
    });

    it('should use default limit when not provided', async () => {
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue(mockDailyResponse);

      const result = await service.getTopInteractedPosts({
        range: 'daily',
        startDate: '2023-01-01',
        endDate: '2023-01-03'
      });

      expect(result.limit).toBe(3);
      expect(getTopInteractedPostsMetrics).toHaveBeenCalledWith(
        'daily',
        '2023-01-01',
        '2023-01-03',
        3
      );
    });

    it('should handle date ranges spanning multiple periods', async () => {
      // Mock with the expected periodKey format for weekly
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue([
        { date: '2023-W01', posts: [mockPostDetail] }, // First week of 2023
        { date: '2023-W02', posts: [mockPostDetail] }  // Second week of 2023
      ]);

      const result = await service.getTopInteractedPosts({
        range: 'weekly',
        startDate: '2023-01-02',
        endDate: '2023-01-15',
        limit: 3
      });

      expect(result.series.length).toBe(2);
      expect(result.series[0].posts).toEqual([mockPostDetail]);
      expect(result.series[1].posts).toEqual([mockPostDetail]);
    });

    it('should format weekly dates correctly', async () => {
        // Mock with the expected periodKey for weekly
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue([
        { date: '2023-W01', posts: [mockPostDetail] } // Monday
      ]);

      const result = await service.getTopInteractedPosts({
        range: 'weekly',
        startDate: '2023-01-02',
        endDate: '2023-01-08',
        limit: 3
      });

      expect(result.series[0].date).toMatch(/^2023-W\d{2} \(\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}\)/);
    });

    it('should format monthly dates correctly', async () => {
        // Mock with the expected periodKey for monthly
      (getTopInteractedPostsMetrics as jest.Mock).mockResolvedValue([
        { date: '2023-01', posts: [mockPostDetail] } // Month-year format
      ]);

      const result = await service.getTopInteractedPosts({
        range: 'monthly',
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        limit: 3
      });

      expect(result.series[0].date).toMatch(/^\d{4}-\d{2} \(\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}\)/);
    });
  });
});