import { getReportedPostsMetrics, getTotalReportedPosts } from '../repositories/reported.posts.repository';
import { AnalyticsBaseService, DataPoint, TimeRangeQuery } from './analytics-base.service';

export interface ReportedPostsResponse {
  metrics: DataPoint[];
  total: number;
  aggregatedByInterval: 'daily' | 'weekly' | 'monthly';
}

export class ReportedPostsService extends AnalyticsBaseService {
  async getReportedMetrics(range: 'daily' | 'weekly' | 'monthly', startDate: string, endDate: string): Promise<ReportedPostsResponse> {
    // Ensure valid date range for query
    const queryStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const queryEndDate = endDate || new Date().toISOString().split('T')[0];

    const metrics = await getReportedPostsMetrics(range, queryStartDate, queryEndDate);
    const total = await getTotalReportedPosts(queryStartDate, queryEndDate);

    const timeRangeQuery: TimeRangeQuery = {
      startDate: queryStartDate,
      endDate: queryEndDate,
      interval: range,
    };

    // Generate the complete series using the base service method
    const completeSeries = this.generateCompleteSeries(metrics, timeRangeQuery, false); // Not cumulative

    return {
      metrics: completeSeries,
      total,
      aggregatedByInterval: range,
    };
  }
}