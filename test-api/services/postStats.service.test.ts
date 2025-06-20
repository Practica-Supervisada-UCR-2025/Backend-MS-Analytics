import { getTotalPostsStatsService } from '../../src/features/analytics/services/postStats.service';
import * as postStatsRepo from '../../src/features/analytics/repositories/postStats.repository';
import { StatsQueryDTO } from '../../src/features/analytics/dto/postStats.dto';

jest.mock('../../src/features/analytics/repositories/postStats.repository');

describe('getTotalPostsStatsService', () => {
  const mockRepo = postStatsRepo.getPostCountsByPeriod as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct structure, total and sorted data (weekly)', async () => {
    const input: StatsQueryDTO = {
      start_date: '2025-06-01',
      end_date: '2025-06-30',
      period: 'weekly',
    };

    const unorderedMock = [
      { label: '2025-W24', count: 8 },
      { label: '2025-W22', count: 5 },
      { label: '2025-W23', count: 2 },
    ];

    mockRepo.mockResolvedValueOnce(unorderedMock);

    const result = await getTotalPostsStatsService(input);

    expect(mockRepo).toHaveBeenCalledWith('2025-06-01', '2025-06-30', 'weekly');
    expect(result).toEqual({
      message: 'Analytics data fetched successfully',
      data: {
        total: 15,
        series: [
          { date: '2025-W22', count: 5 },
          { date: '2025-W23', count: 2 },
          { date: '2025-W24', count: 8 },
        ],
      },
    });
  });

  it('returns fallback sorting when period is invalid', async () => {
    const input = {
      start_date: '2025-06-01',
      end_date: '2025-06-30',
      period: 'invalid' as any,
    };

    const unordered = [
      { label: 'zzz-label', count: 2 },
      { label: 'any-label', count: 1 },
    ];

    mockRepo.mockResolvedValueOnce(unordered);

    const result = await getTotalPostsStatsService(input);

    expect(result.message).toBe('Analytics data fetched successfully');
    expect(result.data.total).toBe(3);
    expect(result.data.series.length).toBe(2);
  });

  it('correctly calculates total and sorts the data (monthly)', async () => {
    const mockData = [
      { label: '06-2025', count: 5 },
      { label: '04-2025', count: 3 },
    ];

    mockRepo.mockResolvedValueOnce(mockData);

    const result = await getTotalPostsStatsService({
      start_date: '2025-04-01',
      end_date: '2025-06-30',
      period: 'monthly',
    });

    expect(result.message).toBe('Analytics data fetched successfully');
    expect(result.data.total).toBe(8);
    expect(result.data.series).toEqual([
      { date: '04-2025', count: 3 },
      { date: '06-2025', count: 5 },
    ]);
  });

  it('returns empty series and total = 0 when repo returns empty array', async () => {
    const input: StatsQueryDTO = {
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      period: 'daily',
    };

    mockRepo.mockResolvedValueOnce([]);

    const result = await getTotalPostsStatsService(input);

    expect(result).toEqual({
      message: 'Analytics data fetched successfully',
      data: {
        total: 0,
        series: [],
      },
    });
  });

  it('correctly calculates total and sorts the data (daily)', async () => {
    const mockData = [
      { label: '03-06-2025', count: 2 },
      { label: '01-06-2025', count: 3 },
    ];

    mockRepo.mockResolvedValueOnce(mockData);

    const result = await getTotalPostsStatsService({
      start_date: '2025-06-01',
      end_date: '2025-06-30',
      period: 'daily',
    });

    expect(result.message).toBe('Analytics data fetched successfully');
    expect(result.data.total).toBe(5);
    expect(result.data.series).toEqual([
      { date: '01-06-2025', count: 3 },
      { date: '03-06-2025', count: 2 },
    ]);
  });
});
