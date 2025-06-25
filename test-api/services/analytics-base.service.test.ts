import { AnalyticsBaseService, DataPoint, TimeRangeQuery } from '../../src/features/analytics/services/analytics-base.service';
import { InternalServerError } from '../../src/utils/errors/api-error';

// Concrete implementation for testing
class TestAnalyticsService extends AnalyticsBaseService {
  // Expose protected methods for testing
  public exposedGenerateCompleteSeries(data: DataPoint[], query: TimeRangeQuery, cumulative: boolean = false): DataPoint[] {
    return this.generateCompleteSeries(data, query, cumulative);
  }

  public exposedGenerateDailySeries(data: DataPoint[], startDate: string, endDate: string, cumulative: boolean = false): DataPoint[] {
    return this.generateDailySeries(data, startDate, endDate, cumulative);
  }

  public exposedGenerateIntervalSeries(data: DataPoint[], cumulative: boolean = false): DataPoint[] {
    return this.generateIntervalSeries(data, cumulative);
  }

  public exposedCreateDateCountMap(data: DataPoint[]): Map<string, number> {
    return this.createDateCountMap(data);
  }

  public exposedCalculateTotal(data: DataPoint[]): number {
    return this.calculateTotal(data);
  }

  public exposedHandleServiceError(error: any, serviceName: string): never {
    return this.handleServiceError(error, serviceName);
  }
}

describe('AnalyticsBaseService', () => {
  let service: TestAnalyticsService;

  beforeEach(() => {
    service = new TestAnalyticsService();
  });

  describe('generateCompleteSeries', () => {
    it('should generate daily series when interval is daily', () => {
      const data: DataPoint[] = [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-03', count: 3 }
      ];

      const query: TimeRangeQuery = {
        startDate: '2023-01-01',
        endDate: '2023-01-03',
        interval: 'daily'
      };

      const result = service.exposedGenerateCompleteSeries(data, query, false);

      expect(result).toEqual([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 0 },
        { date: '2023-01-03', count: 3 }
      ]);
    });

    it('should generate interval series for non-daily intervals', () => {
      const data: DataPoint[] = [
        { date: '2023-01', count: 10 },
        { date: '2023-02', count: 15 }
      ];

      const query: TimeRangeQuery = {
        startDate: '2023-01-01',
        endDate: '2023-02-28',
        interval: 'monthly'
      };

      const result = service.exposedGenerateCompleteSeries(data, query, false);

      expect(result).toEqual([
        { date: '2023-01 (2023-01-01 to 2023-01-31)', count: 10 },
        { date: '2023-02 (2023-02-01 to 2023-02-28)', count: 15 }
      ]);
    });
  });

  describe('generateDailySeries', () => {
    it('should fill missing dates with zero counts', () => {
      const data: DataPoint[] = [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-03', count: 3 }
      ];

      const result = service.exposedGenerateDailySeries(
        data,
        '2023-01-01',
        '2023-01-03',
        false
      );

      expect(result).toEqual([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 0 },
        { date: '2023-01-03', count: 3 }
      ]);
    });

    it('should generate cumulative totals when specified', () => {
      const data: DataPoint[] = [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 },
        { date: '2023-01-03', count: 2 }
      ];

      const result = service.exposedGenerateDailySeries(
        data,
        '2023-01-01',
        '2023-01-03',
        true
      );

      expect(result).toEqual([
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 8 },
        { date: '2023-01-03', count: 10 }
      ]);
    });
  });

  describe('generateIntervalSeries', () => {
    it('should sort data chronologically', () => {
      const data: DataPoint[] = [
        { date: '2023-02', count: 15 },
        { date: '2023-01', count: 10 },
        { date: '2023-03', count: 20 }
      ];

      const result = service.exposedGenerateIntervalSeries(data, false);

      expect(result).toEqual([
        { date: '2023-01', count: 10 },
        { date: '2023-02', count: 15 },
        { date: '2023-03', count: 20 }
      ]);
    });

    it('should calculate cumulative totals when specified', () => {
      const data: DataPoint[] = [
        { date: '2023-01', count: 10 },
        { date: '2023-02', count: 15 },
        { date: '2023-03', count: 20 }
      ];

      const result = service.exposedGenerateIntervalSeries(data, true);

      expect(result).toEqual([
        { date: '2023-01', count: 10 },
        { date: '2023-02', count: 25 },
        { date: '2023-03', count: 45 }
      ]);
    });
  });

  describe('createDateCountMap', () => {
    it('should create a map of dates to counts', () => {
      const data: DataPoint[] = [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 }
      ];

      const result = service.exposedCreateDateCountMap(data);

      expect(result.get('2023-01-01')).toBe(5);
      expect(result.get('2023-01-02')).toBe(3);
    });

    it('should handle empty data set', () => {
      const result = service.exposedCreateDateCountMap([]);
      expect(result.size).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should sum all counts correctly', () => {
      const data: DataPoint[] = [
        { date: '2023-01-01', count: 5 },
        { date: '2023-01-02', count: 3 },
        { date: '2023-01-03', count: 2 }
      ];

      const result = service.exposedCalculateTotal(data);
      expect(result).toBe(10);
    });

    it('should return 0 for empty data set', () => {
      const result = service.exposedCalculateTotal([]);
      expect(result).toBe(0);
    });
  });

  describe('handleServiceError', () => {
    it('should throw InternalServerError with correct message', () => {
      const error = new Error('Test error');
      const serviceName = 'test service';

      expect(() => {
        service.exposedHandleServiceError(error, serviceName);
      }).toThrow(InternalServerError);

      expect(() => {
        service.exposedHandleServiceError(error, serviceName);
      }).toThrow('Failed to retrieve test service');
    });
  });
});