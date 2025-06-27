import { getPostCountsByPeriod } from '../../src/features/analytics/repositories/postStats.repository';
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
  });

  it('should throw if period is invalid', async () => {
    await expect(
      getPostCountsByPeriod('2025-06-01', '2025-06-30', 'yearly' as any)
    ).rejects.toThrow('Invalid period');
  });
});
