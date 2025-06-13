// src/services/posts.service.ts
import { getTopInteractedPostsMetrics, PostDetail } from '../repositories/posts.repository'; // Usamos PostDetail directamente
import { TopPostsQuery } from '../dto/posts.dto';
import { AnalyticsBaseService, TimeRangeQuery } from './analytics-base.service';

// Importamos o definimos aquí la interfaz si no está en dto/posts.dto.ts
// Asegúrate de que esta interfaz esté disponible para el servicio.
// Si ya está definida en dto/posts.dto.ts, no necesitas volver a definirla aquí.
// Ejemplo:
// export interface PostDetail {
//   id: string;
//   userId: string;
//   content: string | null;
//   createdAt: string;
//   updatedAt: string | null;
//   fileUrl: string | null;
//   fileSize: number | null;
//   mediaType: number | null;
//   isActive: boolean;
//   isEdited: boolean;
//   status: number;
//   commentCount: number;
// }


export interface TopInteractedPostsResponse {
  metrics: { date: string, posts: PostDetail[] }[];
  aggregatedByInterval: 'daily' | 'weekly' | 'monthly';
  limit: number;
}

export class PostsService extends AnalyticsBaseService {
  public async getTopInteractedPosts(query: TopPostsQuery): Promise<TopInteractedPostsResponse> {
    const { range, startDate, endDate, limit = 3 } = query;

    const rawMetrics = await getTopInteractedPostsMetrics(range, startDate, endDate, limit);

    const timeRangeQuery: TimeRangeQuery = {
      startDate: startDate,
      endDate: endDate,
      interval: range,
    };

    // La función que rellena los huecos ahora formateará la fecha con el rango
    const completeSeries: { date: string, posts: PostDetail[] }[] = this.generateCompleteSeriesForTopPosts(rawMetrics, timeRangeQuery);

    return {
      metrics: completeSeries,
      aggregatedByInterval: range,
      limit: limit,
    };
  }

  private generateCompleteSeriesForTopPosts(
    dataFromDb: { date: string, posts: PostDetail[] }[],
    timeRangeQuery: TimeRangeQuery
  ): { date: string, posts: PostDetail[] }[] {
    const { startDate, endDate, interval } = timeRangeQuery;
    const completeSeries: { date: string, posts: PostDetail[] }[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    const dataMap = new Map<string, PostDetail[]>();
    dataFromDb.forEach(item => dataMap.set(item.date, item.posts));

    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };

    while (currentDate <= end) {
      let periodKey: string; // La clave para buscar en dataMap (ej. "Week 20-2025")
      let displayDate: string; // La cadena final para la respuesta (ej. "Week 20-2025 (2025-05-12 to 2025-05-18)")
      let nextDate = new Date(currentDate);

      switch (interval) {
        case 'daily':
          periodKey = currentDate.toISOString().split('T')[0];
          displayDate = periodKey; // Para daily, el rango es el mismo día
          nextDate.setDate(currentDate.getDate() + 1);
          break;
        case 'weekly':
          // Calcular el inicio de la semana (Lunes, según ISO 8601)
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));

          // Calcular el final de la semana
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // 6 días después del lunes

          // Formatear el número de semana ISO y el año para la clave
          const isoWeekNo = this.getISOWeekNumber(startOfWeek);
          periodKey = `Week ${isoWeekNo}-${startOfWeek.getFullYear()}`;

          // Formatear el rango de fechas para la visualización
          const formattedStartDate = startOfWeek.toLocaleDateString('en-CA', options); // en-CA para YYYY-MM-DD
          const formattedEndDate = endOfWeek.toLocaleDateString('en-CA', options);
          displayDate = `${periodKey} (${formattedStartDate} to ${formattedEndDate})`;

          nextDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          // Calcular el inicio del mes
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          
          // Calcular el final del mes
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Día 0 del siguiente mes es el último día del actual

          // Formatear el mes y año para la clave
          periodKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
          
          // Formatear el rango de fechas para la visualización
          const formattedStartMonth = startOfMonth.toLocaleDateString('en-CA', options);
          const formattedEndMonth = endOfMonth.toLocaleDateString('en-CA', options);
          displayDate = `${periodKey} (${formattedStartMonth} to ${formattedEndMonth})`;

          nextDate.setMonth(currentDate.getMonth() + 1);
          nextDate.setDate(1); // Set to first day of next month
          break;
        default:
          periodKey = currentDate.toISOString().split('T')[0];
          displayDate = periodKey;
          nextDate.setDate(currentDate.getDate() + 1);
          break;
      }

      const postsForDate = dataMap.get(periodKey) || [];
      completeSeries.push({ date: displayDate, posts: postsForDate });

      currentDate.setTime(nextDate.getTime());
    }

    return completeSeries;
  }

  private getISOWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  }
}