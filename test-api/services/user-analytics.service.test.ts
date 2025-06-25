import { UserAnalyticsService } from '../../src/features/analytics/services/user-analytics.service';
import { UserAnalyticsRepository } from '../../src/features/analytics/repositories/user-analytics.repository';
import { InternalServerError } from '../../src/utils/errors/api-error';
import { DataPoint } from '../../src/features/analytics/services/analytics-base.service';

jest.mock('../../src/features/analytics/repositories/user-analytics.repository');

describe('UserAnalyticsService', () => {
  let service: UserAnalyticsService;
  let mockRepository: jest.Mocked<UserAnalyticsRepository>;

  beforeEach(() => {
    mockRepository = new UserAnalyticsRepository() as jest.Mocked<UserAnalyticsRepository>;
    service = new UserAnalyticsService(mockRepository);
  });

  describe('getUserGrowthStats', () => {
    const mockQuery = {
      startDate: '2023-01-01',
      endDate: '2023-01-03',
      interval: 'daily' as const
    };

    const mockGrowthData: DataPoint[] = [
      { date: '2023-01-01', count: 5 },
      { date: '2023-01-03', count: 3 }
    ];

    beforeEach(() => {
      mockRepository.getTotalUsers = jest.fn().mockResolvedValue(100);
      mockRepository.getTotalActiveUsers = jest.fn().mockResolvedValue(50);
      mockRepository.getUserGrowthData = jest.fn().mockResolvedValue(mockGrowthData);
    });

    it('should return complete daily growth stats with all dates filled', async () => {
      const result = await service.getUserGrowthStats(mockQuery);

      // The service generates cumulative totals
      expect(result).toEqual({
        series: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 5 },
          { date: '2023-01-03', count: 8 }
        ],
        totalUsers: 100,
        totalActiveUsers: 50,
        aggregatedByInterval: 'daily'
      });

      expect(mockRepository.getTotalUsers).toHaveBeenCalled();
      expect(mockRepository.getTotalActiveUsers).toHaveBeenCalled();
      expect(mockRepository.getUserGrowthData).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle monthly interval correctly', async () => {
      const monthlyQuery = {
        startDate: '2023-01-01',
        endDate: '2023-03-31',
        interval: 'monthly' as const
      };

      const monthlyData: DataPoint[] = [
        { date: '2023-01', count: 10 },
        { date: '2023-02', count: 15 },
        { date: '2023-03', count: 20 }
      ];

      mockRepository.getUserGrowthData.mockResolvedValue(monthlyData);

      const result = await service.getUserGrowthStats(monthlyQuery);

      expect(result.series).toEqual([
        { date: '2023-01 (2023-01-01 to 2023-01-31)', count: 10 },
        { date: '2023-02 (2023-02-01 to 2023-02-28)', count: 25 },
        { date: '2023-03 (2023-03-01 to 2023-03-31)', count: 45 }
      ]);
      expect(result.aggregatedByInterval).toBe('monthly');
    });

    it('should use daily interval when specified', async () => {
      const query = {
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        interval: 'daily' as const
      };

      const result = await service.getUserGrowthStats(query);

      expect(result.aggregatedByInterval).toBe('daily');
      expect(mockRepository.getUserGrowthData).toHaveBeenCalledWith(query);
    });

    it('should handle repository errors correctly', async () => {
      const error = new Error('Database error');
      mockRepository.getUserGrowthData.mockRejectedValue(error);

      await expect(service.getUserGrowthStats(mockQuery))
        .rejects
        .toThrow(InternalServerError);
    });

    it('should generate cumulative totals for daily data', async () => {
      const result = await service.getUserGrowthStats(mockQuery);

      expect(result.series).toEqual([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 5 },
        { date: '2023-01-03', count: 8 }
      ]);
    });

    it('should handle empty data sets', async () => {
      mockRepository.getUserGrowthData.mockResolvedValue([]);

      const result = await service.getUserGrowthStats(mockQuery);

      expect(result.series).toEqual([
        { date: '2023-01-01', count: 0 },
        { date: '2023-01-02', count: 0 },
        { date: '2023-01-03', count: 0 }
      ]);
    });
  });

  describe('getUserGrowthStatsNonCumulative', () => {
    const mockQuery = {
      startDate: '2023-01-01',
      endDate: '2023-01-03',
      interval: 'daily' as const
    };

    const mockGrowthData: DataPoint[] = [
      { date: '2023-01-01', count: 5 },
      { date: '2023-01-03', count: 3 }
    ];

    beforeEach(() => {
      mockRepository.getTotalUsers = jest.fn().mockResolvedValue(100);
      mockRepository.getTotalActiveUsers = jest.fn().mockResolvedValue(50);
      mockRepository.getUserGrowthData = jest.fn().mockResolvedValue(mockGrowthData);
    });

    it('should return non-cumulative daily growth stats with all dates filled', async () => {
      const result = await service.getUserGrowthStatsNonCumulative(mockQuery);

      // The service should not generate cumulative totals
      expect(result).toEqual({
        series: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 0 },
          { date: '2023-01-03', count: 3 }
        ],
        totalUsers: 100,
        totalActiveUsers: 50,
        aggregatedByInterval: 'daily'
      });

      expect(mockRepository.getTotalUsers).toHaveBeenCalled();
      expect(mockRepository.getTotalActiveUsers).toHaveBeenCalled();
      expect(mockRepository.getUserGrowthData).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle monthly interval correctly', async () => {
      const monthlyQuery = {
        startDate: '2023-01-01',
        endDate: '2023-03-31',
        interval: 'monthly' as const
      };

      const monthlyData: DataPoint[] = [
        { date: '2023-01', count: 10 },
        { date: '2023-02', count: 15 },
        { date: '2023-03', count: 20 }
      ];

      mockRepository.getUserGrowthData.mockResolvedValue(monthlyData);

      const result = await service.getUserGrowthStatsNonCumulative(monthlyQuery);

      // Verify counts are not cumulative
      expect(result.series).toEqual([
        { date: '2023-01 (2023-01-01 to 2023-01-31)', count: 10 },
        { date: '2023-02 (2023-02-01 to 2023-02-28)', count: 15 },
        { date: '2023-03 (2023-03-01 to 2023-03-31)', count: 20 }
      ]);
      expect(result.aggregatedByInterval).toBe('monthly');
    });

    it('should use daily interval when specified', async () => {
      const query = {
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        interval: 'daily' as const
      };

      const result = await service.getUserGrowthStatsNonCumulative(query);

      expect(result.aggregatedByInterval).toBe('daily');
      expect(mockRepository.getUserGrowthData).toHaveBeenCalledWith(query);
    });

    it('should handle repository errors correctly', async () => {
      const error = new Error('Database error');
      mockRepository.getUserGrowthData.mockRejectedValue(error);

      await expect(service.getUserGrowthStatsNonCumulative(mockQuery))
        .rejects
        .toThrow(InternalServerError);
    });

    it('should handle empty data sets', async () => {
      mockRepository.getUserGrowthData.mockResolvedValue([]);

      const result = await service.getUserGrowthStatsNonCumulative(mockQuery);

      expect(result.series).toEqual([
        { date: '2023-01-01', count: 0 },
        { date: '2023-01-02', count: 0 },
        { date: '2023-01-03', count: 0 }
      ]);
    });

    it('should handle missing interval by defaulting to daily', async () => {
      const queryWithoutInterval = {
        startDate: '2023-01-01',
        endDate: '2023-01-03'
      };

      const result = await service.getUserGrowthStatsNonCumulative(queryWithoutInterval as any);

      expect(result.aggregatedByInterval).toBe('daily');
      expect(mockRepository.getUserGrowthData).toHaveBeenCalledWith({
        ...queryWithoutInterval,
        interval: 'daily'
      });
    });
  });
});