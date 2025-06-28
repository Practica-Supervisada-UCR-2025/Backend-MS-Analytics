import client from '../../../config/database';

export const getPostCountsByPeriod = async (
  startDate: string,
  endDate: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<{ label: string; count: number }[]> => {
  let dateTruncFormat: string;
  let toCharFormat: string;

  switch (period) {
    case 'daily':
      dateTruncFormat = 'day';
      toCharFormat = 'YYYY-MM-DD';
      break;
    case 'weekly':
      dateTruncFormat = 'week';
      toCharFormat = 'IYYY-"W"IW'; // ISO week format: 2025-W19
      break;
    case 'monthly':
      dateTruncFormat = 'month';
      toCharFormat = 'YYYY-MM';
      break;
    default:
      throw new Error('Invalid period');
  }

  const query = `
    SELECT TO_CHAR(DATE_TRUNC($1, created_at), $2) AS label,
           COUNT(*) AS count
    FROM posts
    WHERE created_at BETWEEN $3 AND $4
      AND is_active = true
    GROUP BY label
    ORDER BY MIN(created_at)
  `;

  const values = [dateTruncFormat, toCharFormat, startDate, endDate];

  const res = await client.query(query, values);

  return res.rows.map(row => ({
    label: row.label,
    count: Number(row.count),
  }));
};

export const getTotalPostsCount = async (): Promise<number> => {
  try {
    const query = `
      SELECT COUNT(*) as total
      FROM posts
      WHERE is_active = true
    `;
    
    const result = await client.query(query);
    return parseInt(result.rows[0].total || '0');
  } catch (error) {
    console.error('Error fetching total posts count:', error);
    throw new Error('Failed to retrieve total posts count');
  }
};