import { getPostCountsByPeriod, getTotalPostsCount } from '../../src/features/analytics/repositories/postStats.repository';
import * as db from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('getPostCountsByPeriod', () => {
  const mockQuery = (db.default.query as jest.Mock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correctly formatted results for daily period', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { label: '01-06-2025', count: '3' },
        { label: '02-06-2025', count: '5' },
      ],
    });

    const result = await getPostCountsByPeriod('2025-06-01', '2025-06-10', 'daily');

    expect(result).toEqual([
      { label: '01-06-2025', count: 3 },
      { label: '02-06-2025', count: 5 },
    ]);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('TO_CHAR(DATE_TRUNC($1, created_at), $2)'),
      ['day', 'YYYY-MM-DD', '2025-06-01', '2025-06-10']
    );
  });

  it('should return correctly formatted results for weekly period', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { label: '2025-W23', count: '8' },
        { label: '2025-W24', count: '6' },
      ],
    });

    const result = await getPostCountsByPeriod('2025-06-01', '2025-06-30', 'weekly');

    expect(result).toEqual([
      { label: '2025-W23', count: 8 },
      { label: '2025-W24', count: 6 },
    ]);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('TO_CHAR(DATE_TRUNC($1, created_at), $2)'),
      ['week', 'IYYY-"W"IW', '2025-06-01', '2025-06-30']
    );
  });

  it('should return correctly formatted results for monthly period', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { label: '06-2025', count: '12' },
        { label: '07-2025', count: '15' },
      ],
    });

    const result = await getPostCountsByPeriod('2025-06-01', '2025-07-31', 'monthly');

    expect(result).toEqual([
      { label: '06-2025', count: 12 },
      { label: '07-2025', count: 15 },
    ]);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('TO_CHAR(DATE_TRUNC($1, created_at), $2)'),
      ['month', 'YYYY-MM', '2025-06-01', '2025-07-31']
    );
  });

  it('should throw if period is invalid', async () => {
    await expect(
      getPostCountsByPeriod('2025-06-01', '2025-06-30', 'yearly' as any)
    ).rejects.toThrow('Invalid period');
  });

  it('should handle database query errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

    await expect(
      getPostCountsByPeriod('2025-06-01', '2025-06-30', 'daily')
    ).rejects.toThrow('Database connection failed');
  });

  it('should handle empty result set', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await getPostCountsByPeriod('2025-06-01', '2025-06-10', 'daily');
    expect(result).toEqual([]);
  });
});

describe('getTotalPostsCount', () => {
  const mockQuery = (db.default.query as jest.Mock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the total count of active posts', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '150' }]
    });

    const result = await getTotalPostsCount();
    expect(result).toBe(150);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringMatching(/SELECT\s+COUNT\(\*\)\s+as\s+total\s+FROM\s+posts\s+WHERE\s+is_active\s+=\s+true/)
    );
  });

  it('should handle zero posts', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '0' }]
    });

    const result = await getTotalPostsCount();
    expect(result).toBe(0);
  });

  it('should handle null result', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: null }]
    });

    const result = await getTotalPostsCount();
    expect(result).toBe(0);
  });

  it('should handle database errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database error'));

    await expect(getTotalPostsCount()).rejects.toThrow('Failed to retrieve total posts count');
  });
});
