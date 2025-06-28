import { DataPoint, TimeRangeQuery } from '../services/analytics-base.service';

export interface IReportAnalyticsRepository {
  getReportVolumeData(params: TimeRangeQuery): Promise<DataPoint[]>;
  getTotalReports(startDate: string, endDate: string): Promise<number>;
  getTotalOverallReports(): Promise<number>; 
}