import { ReportAnalyticsService } from '../../src/features/analytics/services/report-analytics.service';
import { ReportAnalyticsRepository } from '../../src/features/analytics/repositories/report-analytics.repository';
import { InternalServerError } from '../../src/utils/errors/api-error';
import { DataPoint } from '../../src/features/analytics/services/analytics-base.service';

jest.mock('../../src/features/analytics/repositories/report-analytics.repository');

describe('ReportAnalyticsService', () => {
  let service: ReportAnalyticsService;
  let mockRepository: jest.Mocked<ReportAnalyticsRepository>;

  beforeEach(() => {
    mockRepository = new ReportAnalyticsRepository() as jest.Mocked<ReportAnalyticsRepository>;
    service = new ReportAnalyticsService(mockRepository);
  });

  describe('getReportVolumeStats', () => {
    const mockQuery = {
      startDate: '2023-01-01',
      endDate: '2023-01-03',
      interval: 'daily' as const
    };

    const mockVolumeData: DataPoint[] = [
      { date: '2023-01-01', count: 5 },
      { date: '2023-01-03', count: 3 }
    ];

    beforeEach(() => {
      mockRepository.getTotalReports = jest.fn().mockResolvedValue(8);
      mockRepository.getReportVolumeData = jest.fn().mockResolvedValue(mockVolumeData);
    });

    it('should return complete daily volume stats with all dates', async () => {
      const result = await service.getReportVolumeStats(mockQuery);

      expect(result).toEqual({
        series: [
          { date: '2023-01-01', count: 5 },
          { date: '2023-01-02', count: 0 },
          { date: '2023-01-03', count: 3 }
        ],
        total: 8,
        aggregatedByInterval: 'daily'
      });

      expect(mockRepository.getTotalReports).toHaveBeenCalledWith(
        mockQuery.startDate,
        mockQuery.endDate
      );
      expect(mockRepository.getReportVolumeData).toHaveBeenCalledWith(mockQuery);
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

      mockRepository.getTotalReports.mockResolvedValue(45);
      mockRepository.getReportVolumeData.mockResolvedValue(monthlyData);

      const result = await service.getReportVolumeStats(monthlyQuery);

      expect(result.series).toEqual([
        { date: '2023-01 (2023-01-01 to 2023-01-31)', count: 10 },
        { date: '2023-02 (2023-02-01 to 2023-02-28)', count: 15 },
        { date: '2023-03 (2023-03-01 to 2023-03-31)', count: 20 }
      ]);
      expect(result.total).toBe(45);
      expect(result.aggregatedByInterval).toBe('monthly');
    });

    it('should use daily interval by default when not specified', async () => {
      const queryWithoutInterval = {
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        interval: 'daily' as const
      };

      const result = await service.getReportVolumeStats(queryWithoutInterval);

      expect(result.aggregatedByInterval).toBe('daily');
      expect(mockRepository.getReportVolumeData).toHaveBeenCalledWith(
        expect.objectContaining({
          interval: 'daily'
        })
      );
    });

    it('should handle repository errors correctly', async () => {
      const error = new Error('Database error');
      mockRepository.getReportVolumeData.mockRejectedValue(error);

      await expect(service.getReportVolumeStats(mockQuery))
        .rejects
        .toThrow(InternalServerError);
    });

    it('should handle empty data sets', async () => {
      mockRepository.getTotalReports.mockResolvedValue(0);
      mockRepository.getReportVolumeData.mockResolvedValue([]);

      const result = await service.getReportVolumeStats(mockQuery);

      expect(result.series).toEqual([
        { date: '2023-01-01', count: 0 },
        { date: '2023-01-02', count: 0 },
        { date: '2023-01-03', count: 0 }
      ]);
      expect(result.total).toBe(0);
    });

    it('should not generate cumulative totals for report volume', async () => {
      const data: DataPoint[] = [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 },
        { date: '2023-01-03', count: 4 }
      ];

      mockRepository.getReportVolumeData.mockResolvedValue(data);

      const result = await service.getReportVolumeStats(mockQuery);

      // Verify counts are not cumulative
      expect(result.series).toEqual([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 },
        { date: '2023-01-03', count: 4 }
      ]);
    });
  });
});