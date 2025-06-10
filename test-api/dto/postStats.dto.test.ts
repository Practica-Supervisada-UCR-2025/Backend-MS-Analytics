import { statsQuerySchema } from '../../src/features/analytics/dto/postStats.dto';

describe('statsQuerySchema', () => {
  it('validates a correct input', () => {
    const result = statsQuerySchema.safeParse({
      start_date: '01-06-2025',
      end_date: '30-06-2025',
      period: 'weekly',
    });

    expect(result.success).toBe(true);
  });

  it('fails on invalid date format', () => {
    const result = statsQuerySchema.safeParse({
      start_date: '2025/06/01',
      end_date: '30-06-2025',
      period: 'monthly',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.start_date).toContain('Invalid date format. Use DD-MM-YYYY');
    }
  });

  it('fails on non-existent calendar date', () => {
    const result = statsQuerySchema.safeParse({
      start_date: '31-06-2025', // junio tiene 30 días
      end_date: '30-06-2025',
      period: 'daily',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.start_date).toContain('Invalid calendar date');
    }
  });

  it('fails on invalid period value', () => {
    const result = statsQuerySchema.safeParse({
      start_date: '01-06-2025',
      end_date: '30-06-2025',
      period: 'yearly',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.period?.[0]).toContain('Expected \'daily\' | \'weekly\' | \'monthly\'');

    }
  });
});
