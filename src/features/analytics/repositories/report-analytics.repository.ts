import client from '../../../config/database';
import { InternalServerError } from '../../../utils/errors/api-error';
import { IReportAnalyticsRepository } from './report-analytics.repository.interface';
import { DataPoint, TimeRangeQuery } from '../services/analytics-base.service';

export class ReportAnalyticsRepository implements IReportAnalyticsRepository {
  async getReportVolumeData(params: TimeRangeQuery): Promise<DataPoint[]> {
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
          COUNT(*) as report_count
        FROM 
          reports
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
        count: Number(row.report_count) || 0 // Ensure invalid numbers return 0
      }));
    } catch (error) {
      console.error('Error fetching report volume data:', error);
      throw new InternalServerError('Failed to retrieve report volume data');
    }
  }

  async getTotalReports(startDate: string, endDate: string): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM reports
        WHERE created_at >= $1 AND created_at <= ($2 || ' 23:59:59')::timestamp
      `;
      
      const result = await client.query(query, [startDate, endDate]);
      return parseInt(result.rows[0].total || '0');
    } catch (error) {
      console.error('Error fetching total reports:', error);
      throw new InternalServerError('Failed to retrieve total reports count');
    }
  }

  async getTotalOverallReports(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as total FROM reports';
      
      const result = await client.query(query);
      return parseInt(result.rows[0].total || '0');
    } catch (error) {
      console.error('Error fetching total overall reports:', error);
      throw new InternalServerError('Failed to retrieve total overall reports count');
    }
  }
}