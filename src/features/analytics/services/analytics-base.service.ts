import { InternalServerError } from '../../../utils/errors/api-error';

// Common interfaces for all analytics services
export interface DataPoint {
  date: string;
  count: number;
}

export interface TimeRangeQuery {
  startDate: string;
  endDate: string;
  interval: 'daily' | 'weekly' | 'monthly';
}

// Abstract base class for analytics services
export abstract class AnalyticsBaseService {
  /**
   * Formats dates uniformly across all services
   */
  protected formatDate(date: string, interval: 'daily' | 'weekly' | 'monthly'): string {
    if (interval === 'daily') {
      return date; // Already in YYYY-MM-DD format
    }
    
    if (interval === 'monthly') {
      // Check if date is already in the uniform format
      if (date.includes(' to ')) {
        // Extract just the YYYY-MM part from the formatted string
        const match = date.match(/^(\d{4}-\d{2})/);
        return match ? match[1] : date;
      }
      
      // date is in YYYY-MM format, return as is
      return date;
    }
    
    if (interval === 'weekly') {
      // Check if date is already in the uniform format
      if (date.includes(' to ')) {
        // Extract just the YYYY-WNN part from the formatted string
        const match = date.match(/^(\d{4}-W\d{2})/);
        return match ? match[1] : date;
      }
      
      // Parse the week format and return the simple format
      // Handle different input formats: "Week 19-2025", "Week 19 2025", "2025-W19"
      let weekNumber: number;
      let year: number;
      
      if (date.includes('Week')) {
        // Format: "Week 19-2025" or "Week 19 2025"
        const match = date.match(/Week\s+(\d+)[-\s](\d{4})/);
        if (match) {
          weekNumber = parseInt(match[1]);
          year = parseInt(match[2]);
        } else {
          return date; // Return as is if can't parse
        }
      } else if (date.includes('-W')) {
        // Format: "2025-W19"
        const match = date.match(/(\d{4})-W(\d+)/);
        if (match) {
          year = parseInt(match[1]);
          weekNumber = parseInt(match[2]);
        } else {
          return date; // Return as is if can't parse
        }
      } else {
        return date; // Return as is if can't parse
      }
      
      return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
    }
    
    return date; // Fallback
  }

  /**
   * Generates a complete data series with all points for the given interval
   */
  protected generateCompleteSeries(
    data: DataPoint[], 
    query: TimeRangeQuery,
    cumulative: boolean = false
  ): DataPoint[] {
    const series = query.interval === 'daily' 
      ? this.generateDailySeries(data, query.startDate, query.endDate, cumulative)
      : this.generateIntervalSeries(data, cumulative);
    
    // Format dates uniformly
    return series.map(item => ({
      ...item,
      date: this.formatDate(item.date, query.interval)
    }));
  }
  
  /**
   * Generates a complete daily series with counts, optionally cumulative
   * Ensures all dates in the range have data points, even if zero
   */
  protected generateDailySeries(
    data: DataPoint[], 
    startDate: string, 
    endDate: string,
    cumulative: boolean = false
  ): DataPoint[] {
    const series: DataPoint[] = [];
    const dateMap = this.createDateCountMap(data);
    
    let runningCount = 0;
    // Use UTC dates to avoid timezone issues
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    
    for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateStr = d.toISOString().substring(0, 10);
      const count = dateMap.get(dateStr) || 0;
      
      if (cumulative) {
        runningCount += count;
        series.push({ date: dateStr, count: runningCount });
      } else {
        series.push({ date: dateStr, count });
      }
    }
    
    return series;
  }
  
  /**
   * Generates a series for weekly or monthly intervals, optionally cumulative
   */
  protected generateIntervalSeries(
    data: DataPoint[],
    cumulative: boolean = false
  ): DataPoint[] {
    // Sort data chronologically
    const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));
    
    if (!cumulative) {
      return sortedData;
    }
    
    // If cumulative, calculate progressive totals
    const series: DataPoint[] = [];
    let runningCount = 0;
    
    sortedData.forEach(item => {
      runningCount += item.count;
      series.push({
        date: item.date,
        count: runningCount
      });
    });
    
    return series;
  }
  
  /**
   * Creates a Map of dates to count values for efficient lookup
   */
  protected createDateCountMap(data: DataPoint[]): Map<string, number> {
    const dateMap = new Map<string, number>();
    data.forEach(item => {
      dateMap.set(item.date, item.count);
    });
    return dateMap;
  }
  
  /**
   * Calculates the total by summing all counts
   */
  protected calculateTotal(data: DataPoint[]): number {
    return data.reduce((sum, item) => sum + item.count, 0);
  }
  
  /**
   * Handles common errors for analytics services
   */
  protected handleServiceError(error: any, serviceName: string): never {
    // Only log errors in non-test environment
    if (process.env.NODE_ENV !== 'test') {
      console.error(`Error in ${serviceName}:`, error);
    }
    throw new InternalServerError(`Failed to retrieve ${serviceName}`);
  }
}