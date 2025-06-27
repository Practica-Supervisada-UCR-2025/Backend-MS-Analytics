import { QueryResult } from 'pg';
import client from '../../../config/database';
import { InternalServerError } from '../../../utils/errors/api-error';

export const getReportedPostsMetrics = async (
  range: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string
): Promise<{ date: string, count: number }[]> => {
  try {
    let dateTrunc = 'day';
    let interval = '1 day';
    let format = 'YYYY-MM-DD';

    switch (range) {
      case 'weekly':
        dateTrunc = 'week';
        interval = '1 week';
        format = '"Week "IW YYYY'; // ISO week number + year
        break;
      case 'monthly':
        dateTrunc = 'month';
        interval = '1 month';
        format = 'YYYY-MM'; // e.g., 2025-06
        break;
    }

    const query = `
      WITH dates AS (
        SELECT generate_series(
          date_trunc($1, $2::timestamptz),
          date_trunc($1, $3::timestamptz),
          $5::interval
        ) AS date
      )
      SELECT 
        TO_CHAR(d.date, $4) AS date,
        COUNT(DISTINCT r.reported_content_id) AS count
      FROM dates d
      LEFT JOIN reports r
        ON date_trunc($1, r.created_at) = d.date
      GROUP BY d.date
      ORDER BY d.date;
    `;

    const result = await client.query(query, [
      dateTrunc,        // $1
      startDate,        // $2
      endDate,          // $3
      format,           // $4
      interval          // $5
    ]);

    // Convert counts to numbers
    return result.rows.map(row => ({
      date: row.date,
      count: parseInt(row.count, 10)
    }));
  } catch (error) {
    throw new InternalServerError('Failed to retrieve reported posts metrics');
  }
};

export const getTotalReportedPosts = async (
  startDate: string,
  endDate: string
): Promise<number> => {
  try {
    const query = `
      SELECT COUNT(DISTINCT r.reported_content_id) AS total
      FROM reports r
      WHERE r.created_at >= $1::timestamptz 
      AND r.created_at < ($2::timestamptz + interval '1 day')
    `;
    const result: QueryResult = await client.query(query, [startDate, endDate]);
    return parseInt(result.rows[0].total, 10);
  } catch (error) {
    throw new InternalServerError('Failed to retrieve total reported posts');
  }
};