import { getReportedPostsMetrics, getTotalReportedPosts } from '../repositories/reported.posts.repository';
import { AnalyticsBaseService, DataPoint, TimeRangeQuery } from './analytics-base.service';

export interface ReportedPostsResponse {
  series: DataPoint[];
  total: number;
  aggregatedByInterval: 'daily' | 'weekly' | 'monthly';
}

export class ReportedPostsService extends AnalyticsBaseService {
  async getReportedMetrics(startDate: string, endDate: string, period: 'daily' | 'weekly' | 'monthly'): Promise<ReportedPostsResponse> {

    const queryStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const queryEndDate = endDate || new Date().toISOString().split('T')[0];

    const series = await getReportedPostsMetrics(period, queryStartDate, queryEndDate);
    const total = await getTotalReportedPosts(queryStartDate, queryEndDate);

    const timeRangeQuery: TimeRangeQuery = {
      startDate: queryStartDate,
      endDate: queryEndDate,
      interval: period,
    };

    const completeSeries = this.generateCompleteSeries(series, timeRangeQuery, false); // Not cumulative

    return {
      series: completeSeries,
      total,
      aggregatedByInterval: period,
    };
  }
}