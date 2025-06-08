import client from '../../../config/database';
import { InternalServerError } from '../../../utils/errors/api-error';
import { IUserAnalyticsRepository } from './user-analytics.repository.interface';
import { DataPoint, TimeRangeQuery } from '../services/analytics-base.service';

export class UserAnalyticsRepository implements IUserAnalyticsRepository {
  async getTotalUsers(): Promise<number> {
    try {
      const result = await client.query('SELECT COUNT(*) as total FROM users');
      return parseInt(result.rows[0].total || '0');
    } catch (error) {
      console.error('Error fetching total users:', error);
      throw new InternalServerError('Failed to retrieve total users count');
    }
  }

  async getTotalActiveUsers(): Promise<number> {
    try {
      const result = await client.query(
        'SELECT COUNT(*) as active FROM users WHERE is_active = true'
      );
      return parseInt(result.rows[0].active || '0');
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw new InternalServerError('Failed to retrieve active users count');
    }
  }

  async getUserGrowthData(params: TimeRangeQuery): Promise<DataPoint[]> {
    try {
      let dateFormat: string;
      let dateGroup: string;
      
      switch (params.interval) {
        case 'weekly':
          // PostgreSQL's to_char with ISO week format
          dateFormat = 'IYYY-"W"IW';
          dateGroup = 'date_trunc(\'week\', created_at)';
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          dateGroup = 'date_trunc(\'month\', created_at)';
          break;
        case 'daily':
        default:
          dateFormat = 'YYYY-MM-DD';
          dateGroup = 'date_trunc(\'day\', created_at)';
          break;
      }
      
      const query = `
        SELECT 
          to_char(${dateGroup}, '${dateFormat}') as date,
          COUNT(*) as new_users
        FROM 
          users
        WHERE 
          created_at >= $1 AND created_at <= ($2 || ' 23:59:59')::timestamp
        GROUP BY 
          date
        ORDER BY 
          min(created_at)
      `;
      
      const result = await client.query(query, [
        params.startDate,
        params.endDate
      ]);
      
      return result.rows.map(row => ({
        date: row.date,
        count: parseInt(row.new_users)
      }));
    } catch (error) {
      console.error('Error fetching user growth data:', error);
      throw new InternalServerError('Failed to retrieve user growth data');
    }
  }
}