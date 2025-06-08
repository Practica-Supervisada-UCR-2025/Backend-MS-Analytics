import { DataPoint, TimeRangeQuery } from '../services/analytics-base.service';

export interface IUserAnalyticsRepository {
  getTotalUsers(): Promise<number>;
  getTotalActiveUsers(): Promise<number>;
  getUserGrowthData(params: TimeRangeQuery): Promise<DataPoint[]>;
}