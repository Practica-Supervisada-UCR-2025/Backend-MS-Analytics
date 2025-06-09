import { UserAnalyticsRepository } from '../../src/features/analytics/repositories/user-analytics.repository';
import client from '../../src/config/database';
import { InternalServerError } from '../../src/utils/errors/api-error';

// The database client is already mocked in setup.ts
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('UserAnalyticsRepository', () => {
  let repository: UserAnalyticsRepository;

  beforeEach(() => {
    repository = new UserAnalyticsRepository();
    jest.clearAllMocks();
  });

  describe('getTotalUsers', () => {
    it('should return total users count', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '100' }]
      });

      const result = await repository.getTotalUsers();
      
      expect(result).toBe(100);
      expect(client.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as total FROM users'
      );
    });

    it('should handle zero users', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }]
      });

      const result = await repository.getTotalUsers();
      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      (client.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.getTotalUsers())
        .rejects
        .toThrow(InternalServerError);
    });
  });

  describe('getTotalActiveUsers', () => {
    it('should return active users count', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ active: '50' }]
      });

      const result = await repository.getTotalActiveUsers();
      
      expect(result).toBe(50);
      expect(client.query).toHaveBeenCalledWith(
        'SELECT COUNT(*) as active FROM users WHERE is_active = true'
      );
    });

    it('should handle zero active users', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ active: '0' }]
      });

      const result = await repository.getTotalActiveUsers();
      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      (client.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.getTotalActiveUsers())
        .rejects
        .toThrow(InternalServerError);
    });
  });

  describe('getUserGrowthData', () => {
    const baseQuery = {
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    it('should return daily growth data', async () => {
      const mockRows = [
        { date: '2023-01-01', new_users: '5' },
        { date: '2023-01-02', new_users: '3' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getUserGrowthData({
        ...baseQuery,
        interval: 'daily'
      });

      expect(result).toEqual([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 }
      ]);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("'YYYY-MM-DD'"),
        [baseQuery.startDate, baseQuery.endDate]
      );
    });

    it('should return weekly growth data', async () => {
      const mockRows = [
        { date: '2023-W01', new_users: '10' },
        { date: '2023-W02', new_users: '15' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getUserGrowthData({
        ...baseQuery,
        interval: 'weekly'
      });

      expect(result).toEqual([
        { date: '2023-W01', count: 10 },
        { date: '2023-W02', count: 15 }
      ]);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('IYYY-"W"IW'),
        [baseQuery.startDate, baseQuery.endDate]
      );
    });

    it('should return monthly growth data', async () => {
      const mockRows = [
        { date: '2023-01', new_users: '30' },
        { date: '2023-02', new_users: '40' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getUserGrowthData({
        ...baseQuery,
        interval: 'monthly'
      });

      expect(result).toEqual([
        { date: '2023-01', count: 30 },
        { date: '2023-02', count: 40 }
      ]);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("'YYYY-MM'"),
        [baseQuery.startDate, baseQuery.endDate]
      );
    });

    it('should handle empty result set', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      const result = await repository.getUserGrowthData({
        ...baseQuery,
        interval: 'daily'
      });

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      (client.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.getUserGrowthData({
        ...baseQuery,
        interval: 'daily'
      }))
        .rejects
        .toThrow(InternalServerError);
    });
  });
});