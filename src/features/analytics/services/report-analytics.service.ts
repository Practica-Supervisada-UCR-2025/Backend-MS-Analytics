import { ReportVolumeQueryDto } from '../dto/report-volume-query.dto';
import { IReportAnalyticsRepository } from '../repositories/report-analytics.repository.interface';
import { ReportAnalyticsRepository } from '../repositories/report-analytics.repository';
import { AnalyticsBaseService, DataPoint } from './analytics-base.service';

interface ReportVolumeResponse {
  series: DataPoint[];
  total: number;
  aggregatedByInterval: string;
}

export class ReportAnalyticsService extends AnalyticsBaseService {
  private repository: IReportAnalyticsRepository;
  
  constructor(repository?: IReportAnalyticsRepository) {
    super();
    this.repository = repository || new ReportAnalyticsRepository();
  }
  
  async getReportVolumeStats(query: ReportVolumeQueryDto): Promise<ReportVolumeResponse> {
    try {
      // Get the total count for the entire period
      const total = await this.repository.getTotalReports(
        query.startDate!,
        query.endDate!
      );
      
      // Get the report data grouped by interval
      const reportData = await this.repository.getReportVolumeData({
        startDate: query.startDate!,
        endDate: query.endDate!,
        interval: query.interval || 'daily'
      });
      
      // Generate series based on interval - not cumulative (false)
      const series = this.generateCompleteSeries(reportData, {
        startDate: query.startDate!,
        endDate: query.endDate!,
        interval: query.interval || 'daily'
      }, false);
      
      return {
        series,
        total,
        aggregatedByInterval: query.interval || 'daily'
      };
    } catch (error) {
      return this.handleServiceError(error, 'report volume statistics');
    }
  }
}