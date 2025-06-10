import client from '../../../config/database';

export const getPostCountsByPeriod = async (
  startDate: string,
  endDate: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<{ label: string; count: number }[]> => {
  let dateTruncFormat: string;
  let toCharFormat: string = '';
  let useCustomFormat = false;

  switch (period) {
    case 'daily':
      dateTruncFormat = 'day';
      toCharFormat = 'DD-MM-YYYY';
      break;
    case 'weekly':
      dateTruncFormat = 'week';
      useCustomFormat = true; // usamos SQL especial
      break;
    case 'monthly':
      dateTruncFormat = 'month';
      toCharFormat = 'MM-YYYY';
      break;
    default:
      throw new Error('Invalid period');
  }

  let query: string;
  let values: any[];

  if (useCustomFormat) {
    query = `
      SELECT
        TO_CHAR(DATE_TRUNC('week', created_at), 'DD-MM-YYYY') || ' al ' ||
        TO_CHAR(DATE_TRUNC('week', created_at) + interval '6 days', 'DD-MM-YYYY') AS label,
        COUNT(*) AS count
      FROM posts
      WHERE created_at BETWEEN $1 AND $2
        AND is_active = true
      GROUP BY label
      ORDER BY label ASC
    `;
    values = [startDate, endDate];
  } else {
    query = `
      SELECT TO_CHAR(DATE_TRUNC($1, created_at), $2) AS label,
             COUNT(*) AS count
      FROM posts
      WHERE created_at BETWEEN $3 AND $4
        AND is_active = true
      GROUP BY label
      ORDER BY label ASC
    `;
    values = [dateTruncFormat, toCharFormat, startDate, endDate];
  }

  const res = await client.query(query, values);

  return res.rows.map(row => ({
    label: row.label,
    count: Number(row.count),
  }));
};
