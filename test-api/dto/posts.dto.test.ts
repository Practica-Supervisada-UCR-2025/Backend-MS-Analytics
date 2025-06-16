import { topPostsQuerySchema, TopPostsQuery } from '../../src/features/analytics/dto/posts.dto';

describe('TopPostsQuery Schema', () => {
  it('should validate correct data', async () => {
    const validData: TopPostsQuery = {
      range: 'daily',
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      limit: 5
    };

    const result = await topPostsQuerySchema.validate(validData);
    expect(result).toEqual(validData);
  });

  it('should default range to daily when not provided', async () => {
    const data = {
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    const result = await topPostsQuerySchema.validate(data);
    expect(result.range).toBe('daily');
  });

  it('should transform dates with time component', async () => {
    const data = {
      range: 'daily',
      startDate: '2023-01-01T12:00:00Z',
      endDate: '2023-01-31T12:00:00Z'
    };

    const result = await topPostsQuerySchema.validate(data);
    expect(result.startDate).toBe('2023-01-01');
    expect(result.endDate).toBe('2023-01-31');
  });

  it('should reject when dates are not provided', async () => {
    const data = {
      range: 'daily'
    };

    await expect(topPostsQuerySchema.validate(data)).rejects.toThrow('startDate is required');
  });

  it('should reject invalid range', async () => {
    const data = {
      range: 'invalid',
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    await expect(topPostsQuerySchema.validate(data)).rejects.toThrow('Invalid range');
  });

  it('should reject invalid date format', async () => {
    const data = {
      range: 'daily',
      startDate: '01-01-2023',
      endDate: '31-01-2023'
    };

    await expect(topPostsQuerySchema.validate(data)).rejects.toThrow('Invalid startDate format');
  });

  it('should reject when startDate is after endDate', async () => {
    const data = {
      range: 'daily',
      startDate: '2023-01-31',
      endDate: '2023-01-01'
    };

    await expect(topPostsQuerySchema.validate(data)).rejects.toThrow('startDate must be before or equal to endDate');
  });

  it('should accept all valid ranges', async () => {
    const ranges = ['daily', 'weekly', 'monthly'];

    for (const range of ranges) {
      const data = {
        range,
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      const result = await topPostsQuerySchema.validate(data);
      expect(result.range).toBe(range);
    }
  });

  it('should handle limit validation', async () => {
    const data = {
      range: 'daily',
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      limit: 5
    };

    const result = await topPostsQuerySchema.validate(data);
    expect(result.limit).toBe(5);
  });

  it('should reject invalid limit values', async () => {
    const data = {
      range: 'daily',
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      limit: 11
    };

    await expect(topPostsQuerySchema.validate(data)).rejects.toThrow('Limit cannot exceed 10');
  });

  it('should default limit to 3 when not provided', async () => {
    const data = {
      range: 'daily',
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    const result = await topPostsQuerySchema.validate(data);
    expect(result.limit).toBe(3);
  });
}); 