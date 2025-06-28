import { StatsQueryDTO } from '../dto/postStats.dto';
import { getPostCountsByPeriod, getTotalPostsCount } from '../repositories/postStats.repository';

interface AnalyticsDataPoint {
  date: string;
  count: number;
}

interface PostStatsResponse {
  message: string;
  data: {
    series: AnalyticsDataPoint[];
    total: number;
    overallTotal: number;
  };
}

const extractSortableDate = (label: string, period: string): Date => {
  if (period === 'daily') {
    const [day, month, year] = label.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  if (period === 'monthly') {
    const [month, year] = label.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  // weekly: "YYYY-Www" — sortable as string
  return new Date(0);
};

export const getTotalPostsStatsService = async (
  query: StatsQueryDTO
): Promise<PostStatsResponse> => {
  const { start_date, end_date, period } = query;

  const data = await getPostCountsByPeriod(start_date, end_date, period);

  const total = data.reduce((sum, entry) => sum + entry.count, 0);

   const overallTotal = await getTotalPostsCount();

  const sorted = data.sort((a, b) => {
    if (period === 'weekly') {
      return a.label.localeCompare(b.label);
    }
    const aDate = extractSortableDate(a.label, period);
    const bDate = extractSortableDate(b.label, period);
    return aDate.getTime() - bDate.getTime();
  });

  const series = sorted.map(entry => ({
    date: entry.label,
    count: entry.count,
  }));

  return {
    message: 'Analytics data fetched successfully',
    data: {
      series,
      total,
      overallTotal,
    },
  };
};
