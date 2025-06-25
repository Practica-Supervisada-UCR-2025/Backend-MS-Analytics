import { getTopInteractedPostsMetrics, PostDetail } from '../repositories/posts.repository';
import { TopPostsQuery } from '../dto/posts.dto';
import { AnalyticsBaseService, TimeRangeQuery } from './analytics-base.service';

export interface TopInteractedPostsResponse {
  metrics: { date: string, posts: PostDetail[] }[];
  aggregatedByInterval: 'daily' | 'weekly' | 'monthly';
  limit: number;
}

export class PostsService extends AnalyticsBaseService {
  public async getTopInteractedPosts(query: TopPostsQuery): Promise<TopInteractedPostsResponse> {
    const { range, startDate, endDate, limit = 3 } = query;

    const rawMetrics = await getTopInteractedPostsMetrics(range, startDate, endDate, limit);

    const timeRangeQuery: TimeRangeQuery = {
      startDate: startDate,
      endDate: endDate,
      interval: range,
    };

    const completeSeries: { date: string, posts: PostDetail[] }[] = this.generateCompleteSeriesForTopPosts(rawMetrics, timeRangeQuery);

    return {
      metrics: completeSeries,
      aggregatedByInterval: range,
      limit: limit,
    };
  }

  private generateCompleteSeriesForTopPosts(
    dataFromDb: { date: string, posts: PostDetail[] }[],
    timeRangeQuery: TimeRangeQuery
  ): { date: string, posts: PostDetail[] }[] {
    const { startDate, endDate, interval } = timeRangeQuery;
    const completeSeries: { date: string, posts: PostDetail[] }[] = [];

    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    let currentDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));

    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));

    const dataMap = new Map<string, PostDetail[]>();
    dataFromDb.forEach(item => dataMap.set(item.date, item.posts));

    while (currentDate <= end) {
      let periodKey: string;

      switch (interval) {
        case 'daily':
          periodKey = currentDate.toISOString().split('T')[0];
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          break;
        case 'weekly':
          const startOfWeek = new Date(currentDate);
          startOfWeek.setUTCDate(currentDate.getUTCDate() - (currentDate.getUTCDay() === 0 ? 6 : currentDate.getUTCDay() - 1));

          const isoWeekNo = this.getISOWeekNumber(startOfWeek);
          periodKey = `${startOfWeek.getUTCFullYear()}-W${isoWeekNo.toString().padStart(2, '0')}`;

          currentDate.setUTCDate(currentDate.getUTCDate() + 7);
          break;
        case 'monthly':
          periodKey = `${currentDate.getUTCFullYear()}-${(currentDate.getUTCMonth() + 1).toString().padStart(2, '0')}`;

          currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
          currentDate.setUTCDate(1);
          break;
        default:
          periodKey = currentDate.toISOString().split('T')[0];
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          break;
      }

      const postsForDate = dataMap.get(periodKey) || [];
      const formattedDate = this.formatDate(periodKey, interval);
      completeSeries.push({ date: formattedDate, posts: postsForDate });
    }

    return completeSeries;
  }

  private getISOWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }
}