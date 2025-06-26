import { ReportedPostsService } from '../../src/features/analytics/services/reported.posts.service';
import * as reportedPostsRepository from '../../src/features/analytics/repositories/reported.posts.repository';
import { InternalServerError } from '../../src/utils/errors/api-error';

// Mock the repository
jest.mock('../../src/features/analytics/repositories/reported.posts.repository');

describe('ReportedPostsService', () => {
  let service: ReportedPostsService;
  const mockDate = '2023-01-01';
  const mockEndDate = '2023-01-31';

  beforeEach(() => {
    service = new ReportedPostsService();
    jest.clearAllMocks();
  });

  describe('getReportedMetrics', () => {
    const mockMetrics = [
      { date: '2023-01-01', count: 5 },
      { date: '2023-01-02', count: 3 }
    ];

    const mockTotal = 8;

    it('should return metrics with complete series', async () => {
      // Mock repository responses
      (reportedPostsRepository.getReportedPostsMetrics as jest.Mock).mockResolvedValue(mockMetrics);
      (reportedPostsRepository.getTotalReportedPosts as jest.Mock).mockResolvedValue(mockTotal);

      const result = await service.getReportedMetrics(mockDate, mockEndDate, 'daily');

      // Verify the structure of the response
      expect(result).toMatchObject({
        total: mockTotal,
        aggregatedByInterval: 'daily'
      });

      // Verify metrics array has the correct structure
      expect(result.series).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ date: '2023-01-01', count: 5 }),
          expect.objectContaining({ date: '2023-01-02', count: 3 })
        ])
      );

      // Verify repository calls
      expect(reportedPostsRepository.getReportedPostsMetrics).toHaveBeenCalledWith(
        'daily',
        mockDate,
        mockEndDate
      );
      expect(reportedPostsRepository.getTotalReportedPosts).toHaveBeenCalledWith(
        mockDate,
        mockEndDate
      );
    });

    it('should use default date range when not provided', async () => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const expectedStartDate = thirtyDaysAgo.toISOString().split('T')[0];
      const expectedEndDate = today.toISOString().split('T')[0];

      (reportedPostsRepository.getReportedPostsMetrics as jest.Mock).mockResolvedValue(mockMetrics);
      (reportedPostsRepository.getTotalReportedPosts as jest.Mock).mockResolvedValue(mockTotal);

      await service.getReportedMetrics('', '', 'daily');

      expect(reportedPostsRepository.getReportedPostsMetrics).toHaveBeenCalledWith(
        'daily',
        expectedStartDate,
        expectedEndDate
      );
      expect(reportedPostsRepository.getTotalReportedPosts).toHaveBeenCalledWith(
        expectedStartDate,
        expectedEndDate
      );
    });

    it('should handle weekly aggregation', async () => {
      const weeklyMetrics = [
        { date: '2023-W01 (2022-12-26 to 2023-01-01)', count: 10 },
        { date: '2023-W02 (2023-01-02 to 2023-01-08)', count: 15 }
      ];

      (reportedPostsRepository.getReportedPostsMetrics as jest.Mock).mockResolvedValue(weeklyMetrics);
      (reportedPostsRepository.getTotalReportedPosts as jest.Mock).mockResolvedValue(mockTotal);

      const result = await service.getReportedMetrics(mockDate, mockEndDate, 'weekly');

      expect(result).toMatchObject({
        total: mockTotal,
        aggregatedByInterval: 'weekly'
      });

      expect(result.series).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ date: '2023-W01 (2022-12-26 to 2023-01-01)', count: 10 }),
          expect.objectContaining({ date: '2023-W02 (2023-01-02 to 2023-01-08)', count: 15 })
        ])
      );
    });

    it('should handle monthly aggregation', async () => {
      const monthlyMetrics = [
        { date: '2023-01 (2023-01-01 to 2023-01-31)', count: 30 },
        { date: '2023-02 (2023-02-01 to 2023-02-28)', count: 40 }
      ];

      (reportedPostsRepository.getReportedPostsMetrics as jest.Mock).mockResolvedValue(monthlyMetrics);
      (reportedPostsRepository.getTotalReportedPosts as jest.Mock).mockResolvedValue(mockTotal);

      const result = await service.getReportedMetrics(mockDate, mockEndDate, 'monthly');

      expect(result).toMatchObject({
        total: mockTotal,
        aggregatedByInterval: 'monthly'
      });

      expect(result.series).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ date: '2023-01 (2023-01-01 to 2023-01-31)', count: 30 }),
          expect.objectContaining({ date: '2023-02 (2023-02-01 to 2023-02-28)', count: 40 })
        ])
      );
    });

    it('should handle repository errors', async () => {
      const error = new InternalServerError('Failed to retrieve reported posts metrics');
      (reportedPostsRepository.getReportedPostsMetrics as jest.Mock).mockRejectedValue(error);

      await expect(service.getReportedMetrics(mockDate, mockEndDate, 'daily'))
        .rejects
        .toThrow(InternalServerError);
    });
  });
}); 