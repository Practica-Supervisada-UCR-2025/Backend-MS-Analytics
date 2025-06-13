import { getPostCountsByPeriod } from '../../src/features/analytics/repositories/postStats.repository';
import * as db from '../../src/config/database';

jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(), // 👈 esto garantiza que client.query exista y sea un mock
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
  });

  it('should return correctly formatted results for weekly period', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { label: '01-06-2025 al 07-06-2025', count: '8' },
        { label: '08-06-2025 al 14-06-2025', count: '6' },
      ],
    });

    const result = await getPostCountsByPeriod('2025-06-01', '2025-06-30', 'weekly');

    expect(result).toEqual([
      { label: '01-06-2025 al 07-06-2025', count: 8 },
      { label: '08-06-2025 al 14-06-2025', count: 6 },
    ]);
  });

  it('should throw if period is invalid', async () => {
    await expect(
      getPostCountsByPeriod('2025-06-01', '2025-06-30', 'yearly' as any)
    ).rejects.toThrow('Invalid period');
  });
});
