import { ReportAnalyticsRepository } from '../../src/features/analytics/repositories/report-analytics.repository';
import client from '../../src/config/database';
import { InternalServerError } from '../../src/utils/errors/api-error';

// The database client is already mocked in setup.ts
jest.mock('../../src/config/database', () => ({
  query: jest.fn()
}));

describe('ReportAnalyticsRepository', () => {
  let repository: ReportAnalyticsRepository;

  beforeEach(() => {
    repository = new ReportAnalyticsRepository();
    jest.clearAllMocks();
  });

  describe('getReportVolumeData', () => {
    const baseQuery = {
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    it('should return daily volume data', async () => {
      const mockRows = [
        { date: '2023-01-01', report_count: '5' },
        { date: '2023-01-02', report_count: '3' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getReportVolumeData({
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

    it('should return weekly volume data', async () => {
      const mockRows = [
        { date: '2023-W01', report_count: '10' },
        { date: '2023-W02', report_count: '15' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getReportVolumeData({
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

    it('should return monthly volume data', async () => {
      const mockRows = [
        { date: '2023-01', report_count: '30' },
        { date: '2023-02', report_count: '40' }
      ];

      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getReportVolumeData({
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

      const result = await repository.getReportVolumeData({
        ...baseQuery,
        interval: 'daily'
      });

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      (client.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.getReportVolumeData({
        ...baseQuery,
        interval: 'daily'
      }))
        .rejects
        .toThrow(InternalServerError);
    });

    it('should use daily format as default for invalid interval', async () => {
      const mockRows = [{ date: '2023-01-01', report_count: '5' }];
      (client.query as jest.Mock).mockResolvedValueOnce({ rows: mockRows });

      const result = await repository.getReportVolumeData({
        ...baseQuery,
        interval: 'invalid' as any
      });

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("'YYYY-MM-DD'"),
        expect.any(Array)
      );
    });
  });

  describe('getTotalReports', () => {
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';

    it('should return total reports count for date range', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '100' }]
      });

      const result = await repository.getTotalReports(startDate, endDate);
      
      expect(result).toBe(100);
      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*) as total'),
        [startDate, endDate]
      );
    });

    it('should handle zero reports', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }]
      });

      const result = await repository.getTotalReports(startDate, endDate);
      expect(result).toBe(0);
    });

    it('should handle database errors', async () => {
      (client.query as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

      await expect(repository.getTotalReports(startDate, endDate))
        .rejects
        .toThrow(InternalServerError);
    });

    it('should properly format timestamp range in query', async () => {
      (client.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ total: '0' }]
      });

      await repository.getTotalReports(startDate, endDate);

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining("' 23:59:59')::timestamp"),
        [startDate, endDate]
      );
    });
  });
});