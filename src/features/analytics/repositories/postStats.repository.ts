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
      toCharFormat = 'DD-MM-YYYY';
      break;
    case 'weekly':
      dateTruncFormat = 'week';
      toCharFormat = `IYYY-"W"IW`; // ISO week format
      break;
    case 'monthly':
      dateTruncFormat = 'month';
      toCharFormat = 'MM-YYYY';
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
