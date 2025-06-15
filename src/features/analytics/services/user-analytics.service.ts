import { UserGrowthQueryDto } from '../dto/user-growth-query.dto';
import { IUserAnalyticsRepository } from '../repositories/user-analytics.repository.interface';
import { UserAnalyticsRepository } from '../repositories/user-analytics.repository';
import { AnalyticsBaseService, DataPoint } from './analytics-base.service';

interface UserGrowthResponse {
  series: DataPoint[];
  totalUsers: number;
  totalActiveUsers: number;
  aggregatedByInterval: string;
}

export class UserAnalyticsService extends AnalyticsBaseService {
  private repository: IUserAnalyticsRepository;
  
  constructor(repository?: IUserAnalyticsRepository) {
    super();
    this.repository = repository || new UserAnalyticsRepository();
  }
  
  async getUserGrowthStats(query: UserGrowthQueryDto): Promise<UserGrowthResponse> {
    try {
      // Get totals
      const [totalUsers, totalActiveUsers] = await Promise.all([
        this.repository.getTotalUsers(),
        this.repository.getTotalActiveUsers()
      ]);
      
      // Get growth data
      const growthData = await this.repository.getUserGrowthData({
        startDate: query.startDate!,
        endDate: query.endDate!,
        interval: query.interval || 'daily'
      });
      
      // Generate series based on interval 
      const series = this.generateCompleteSeries(growthData, {
        startDate: query.startDate!,
        endDate: query.endDate!,
        interval: query.interval || 'daily'
      }, true); // true to indicate cumulative data
      
      return {
        series,
        totalUsers,
        totalActiveUsers,
        aggregatedByInterval: query.interval || 'daily'
      };
    } catch (error) {
      this.handleServiceError(error, 'user growth statistics');
    }
  }

  async getUserGrowthStatsNonCumulative(query: UserGrowthQueryDto): Promise<UserGrowthResponse> {
    try {
      // Get totals
      const [totalUsers, totalActiveUsers] = await Promise.all([
        this.repository.getTotalUsers(),
        this.repository.getTotalActiveUsers()
      ]);
      
      // Get growth data
      const growthData = await this.repository.getUserGrowthData({
        startDate: query.startDate!,
        endDate: query.endDate!,
        interval: query.interval || 'daily'
      });
      
      const series = this.generateCompleteSeries(growthData, {
        startDate: query.startDate!,
        endDate: query.endDate!,
        interval: query.interval || 'daily'
      }, false); 
      
      return {
        series,
        totalUsers,
        totalActiveUsers,
        aggregatedByInterval: query.interval || 'daily'
      };
    } catch (error) {
      this.handleServiceError(error, 'user growth statistics');
    }
  }
}