import { StatsQueryDTO } from '../dto/postStats.dto';
import { getPostCountsByPeriod } from '../repositories/postStats.repository';

interface PostStatsEntry {
  label: string;
  count: number;
}

interface PostStatsResponse {
  range: 'daily' | 'weekly' | 'monthly';
  total: number;
  data: PostStatsEntry[];
}

const extractSortableDate = (label: string, period: string): Date => {
  if (period === 'weekly') {
    const [start] = label.split(' al ');
    const [day, month, year] = start.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  if (period === 'daily') {
    const [day, month, year] = label.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  if (period === 'monthly') {
    const [month, year] = label.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  return new Date(0); // fallback
};

export const getTotalPostsStatsService = async (
  query: StatsQueryDTO
): Promise<PostStatsResponse> => {
  const { start_date, end_date, period } = query;

  const data = await getPostCountsByPeriod(start_date, end_date, period);

  const total = data.reduce((sum, entry) => sum + entry.count, 0);

  const sorted = data.sort((a, b) => {
    const aDate = extractSortableDate(a.label, period);
    const bDate = extractSortableDate(b.label, period);
    return aDate.getTime() - bDate.getTime();
  });

  return {
    range: period,
    total,
    data: sorted,
  };
};
