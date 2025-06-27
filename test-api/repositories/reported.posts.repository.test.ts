import client from '../../src/config/database';
import { getReportedPostsMetrics, getTotalReportedPosts } from '../../src/features/analytics/repositories/reported.posts.repository';
import { InternalServerError } from '../../src/utils/errors/api-error';

// Mock the database client
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('ReportedPostsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getReportedPostsMetrics', () => {
    const baseQuery = {
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    it('should return daily metrics', async () => {
      const mockRows = [
        { date: '2023-01-01', count: '5' },
        { date: '2023-01-02', count: '3' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await getReportedPostsMetrics('daily', baseQuery.startDate, baseQuery.endDate);

      expect(result).toEqual([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 }
      ]);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('generate_series'),
        ['day', baseQuery.startDate, baseQuery.endDate, 'YYYY-MM-DD', '1 day']
      );
    });

    it('should return weekly metrics', async () => {
      const mockRows = [
        { date: 'Week 01 2023', count: '10' },
        { date: 'Week 02 2023', count: '15' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await getReportedPostsMetrics('weekly', baseQuery.startDate, baseQuery.endDate);

      expect(result).toEqual([
        { date: 'Week 01 2023', count: 10 },
        { date: 'Week 02 2023', count: 15 }
      ]);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('generate_series'),
        ['week', baseQuery.startDate, baseQuery.endDate, '"Week "IW YYYY', '1 week']
      );
    });

    it('should return monthly metrics', async () => {
      const mockRows = [
        { date: '2023-01', count: '30' },
        { date: '2023-02', count: '40' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await getReportedPostsMetrics('monthly', baseQuery.startDate, baseQuery.endDate);

      expect(result).toEqual([
        { date: '2023-01', count: 30 },
        { date: '2023-02', count: 40 }
      ]);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('generate_series'),
        ['month', baseQuery.startDate, baseQuery.endDate, 'YYYY-MM', '1 month']
      );
    });

    it('should handle empty result set', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await getReportedPostsMetrics('daily', baseQuery.startDate, baseQuery.endDate);

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      (client.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(getReportedPostsMetrics('daily', baseQuery.startDate, baseQuery.endDate))
        .rejects
        .toThrow(InternalServerError);
    });
  });

  describe('getTotalReportedPosts', () => {
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';

    it('should return total reported posts count for date range', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '100' }]
      });

      const result = await getTotalReportedPosts(startDate, endDate);
      
      expect(result).toBe(100);
      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(DISTINCT r.reported_content_id)'),
        [startDate, endDate]
      );
    });

    it('should handle zero reported posts', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }]
      });

      const result = await getTotalReportedPosts(startDate, endDate);
      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      (client.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(getTotalReportedPosts(startDate, endDate))
        .rejects
        .toThrow(InternalServerError);
    });

    it('should properly format timestamp range in query', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }]
      });

      await getTotalReportedPosts(startDate, endDate);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("interval '1 day'"),
        [startDate, endDate]
      );
    });
  });
}); 