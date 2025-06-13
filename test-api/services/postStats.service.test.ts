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
      { label: '15-06-2025 al 21-06-2025', count: 8 },
      { label: '01-06-2025 al 07-06-2025', count: 5 },
      { label: '08-06-2025 al 14-06-2025', count: 2 },
    ];

    mockRepo.mockResolvedValueOnce(unorderedMock);

    const result = await getTotalPostsStatsService(input);

    expect(mockRepo).toHaveBeenCalledWith('2025-06-01', '2025-06-30', 'weekly');

    expect(result).toEqual({
      range: 'weekly',
      total: 15,
      data: [
        { label: '01-06-2025 al 07-06-2025', count: 5 },
        { label: '08-06-2025 al 14-06-2025', count: 2 },
        { label: '15-06-2025 al 21-06-2025', count: 8 },
      ],
    });
  });

  it('returns fallback date for unknown period value', async () => {
    const input = {
      start_date: '2025-06-01',
      end_date: '2025-06-30',
      period: 'invalid' as any,
    };

    const unordered = [
      { label: 'any-label', count: 1 },
      { label: 'zzz-label', count: 2 },
    ];

    const mockRepo = require('../../src/features/analytics/repositories/postStats.repository');
    mockRepo.getPostCountsByPeriod.mockResolvedValueOnce(unordered);

    const result = await getTotalPostsStatsService(input);

    expect(result.total).toBe(3);
    expect(result.data.length).toBe(2);
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

  expect(result.total).toBe(8);
  expect(result.data).toEqual([
    { label: '04-2025', count: 3 },
    { label: '06-2025', count: 5 },
  ]);
});
  it('returns empty data and total = 0 when repo returns empty array', async () => {
    const input: StatsQueryDTO = {
      start_date: '2025-01-01',
      end_date: '2025-01-31',
      period: 'daily',
    };

    mockRepo.mockResolvedValueOnce([]);

    const result = await getTotalPostsStatsService(input);

    expect(result).toEqual({
      range: 'daily',
      total: 0,
      data: [],
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

    expect(result.total).toBe(5);
    expect(result.data).toEqual([
      { label: '01-06-2025', count: 3 },
      { label: '03-06-2025', count: 2 },
    ]);
  });
});
