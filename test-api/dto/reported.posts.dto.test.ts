import { reportedPostsQuerySchema, ReportedPostsQuery } from '../../src/features/analytics/dto/reported.posts.dto';

describe('ReportedPostsQuery Schema', () => {
  it('should validate correct data', async () => {
    const validData: ReportedPostsQuery = {
      interval: 'daily',
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    const result = await reportedPostsQuerySchema.validate(validData);
    expect(result).toEqual(validData);
  });

  it('should default interval to daily when not provided', async () => {
    const data = {
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    const result = await reportedPostsQuerySchema.validate(data);
    expect(result.interval).toBe('daily');
  });

  it('should transform dates with time component', async () => {
    const data = {
      interval: 'daily',
      startDate: '2023-01-01T12:00:00Z',
      endDate: '2023-01-31T12:00:00Z'
    };

    const result = await reportedPostsQuerySchema.validate(data);
    expect(result.startDate).toBe('2023-01-01');
    expect(result.endDate).toBe('2023-01-31');
  });

  it('should set default dates when not provided', async () => {
    const data = {
      interval: 'daily'
    };

    const result = await reportedPostsQuerySchema.validate(data);
    expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(result.startDate).getTime()).toBeLessThanOrEqual(new Date(result.endDate).getTime());
  });

  it('should reject invalid interval', async () => {
    const data = {
      interval: 'invalid',
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    try {
      await reportedPostsQuerySchema.validate(data, { abortEarly: false });
      throw new Error('Validation should have failed');
    } catch (error: any) {
      expect(error.errors).toContain('Invalid interval. Must be daily, weekly, or monthly');
    }
  });

  it('should reject invalid endDate format', async () => {
    const data = {
      interval: 'daily',
      startDate: '2023-01-01',
      endDate: '31-01-2023'
    };

    try {
      await reportedPostsQuerySchema.validate(data, { abortEarly: false });
      throw new Error('Validation should have failed');
    } catch (error: any) {
      expect(error.errors).toContain('Invalid endDate format. Use YYYY-MM-DD');
    }
  });

  it('should reject invalid startDate format', async () => {
    const data = {
      interval: 'daily',
      startDate: '01-01-2023',
      endDate: '2023-01-31'
    };

    try {
      await reportedPostsQuerySchema.validate(data, { abortEarly: false });
      throw new Error('Validation should have failed');
    } catch (error: any) {
      expect(error.errors).toContain('Invalid startDate format. Use YYYY-MM-DD');
    }
  });

  it('should reject when startDate is after endDate', async () => {
    const data = {
      interval: 'daily',
      startDate: '2023-01-31',
      endDate: '2023-01-01'
    };

    try {
      await reportedPostsQuerySchema.validate(data, { abortEarly: false });
      throw new Error('Validation should have failed');
    } catch (error: any) {
      expect(error.errors).toContain('startDate must be before or equal to endDate');
    }
  });

  it('should accept all valid intervals', async () => {
    const intervals = ['daily', 'weekly', 'monthly'];

    for (const interval of intervals) {
      const data = {
        interval,
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      };

      const result = await reportedPostsQuerySchema.validate(data);
      expect(result.interval).toBe(interval);
    }
  });

  it('should handle date transformations consistently', async () => {
    const data = {
      interval: 'daily',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2023-01-31T23:59:59.999Z'
    };

    const result = await reportedPostsQuerySchema.validate(data);
    expect(result.startDate).toBe('2023-01-01');
    expect(result.endDate).toBe('2023-01-31');
  });

  it('should reject completely invalid startDate', async () => {
    const data = {
      interval: 'daily',
      startDate: 'invalid-date',
      endDate: '2023-01-31'
    };

    try {
      await reportedPostsQuerySchema.validate(data, { abortEarly: false });
      throw new Error('Validation should have failed');
    } catch (error: any) {
      expect(error.errors).toContain('Invalid startDate');
    }
  });

  it('should reject completely invalid dates', async () => {
    const data = {
      interval: 'daily',
      startDate: '2023-13-01', // Invalid month
      endDate: '2023-01-32'    // Invalid day
    };

    try {
      await reportedPostsQuerySchema.validate(data, { abortEarly: false });
      throw new Error('Validation should have failed');
    } catch (error: any) {
      expect(error.errors).toContain('Invalid startDate');
      expect(error.errors).toContain('Invalid endDate');
    }
  });
});
