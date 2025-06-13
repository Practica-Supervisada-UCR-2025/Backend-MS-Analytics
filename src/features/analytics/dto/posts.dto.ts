// src/dto/posts.dto.ts
import * as yup from 'yup';

export interface TopPostsQuery {
  range: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  limit?: number;
}

// Nueva interfaz para los detalles completos del post
export interface PostDetail {
  id: string;
  userId: string;
  content: string | null;
  createdAt: string; // Usaremos string para la fecha formateada
  updatedAt: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mediaType: number | null;
  isActive: boolean;
  isEdited: boolean;
  status: number;
  commentCount: number;
}

// Interfaz TopPostMetric ahora usa PostDetail
export interface TopPostMetric {
  date: string;
  posts: PostDetail[];
}

export const topPostsQuerySchema = yup.object({
  range: yup
    .string()
    .oneOf(['daily', 'weekly', 'monthly'], 'Invalid range. Must be daily, weekly, or monthly')
    .default('daily'),

  startDate: yup
    .string()
    .transform((value) => {
      if (value) {
        const trimmedValue = value.trim();
        return trimmedValue.split('T')[0];
      }
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 30);
      return defaultDate.toISOString().split('T')[0];
    })
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid startDate format. Use YYYY-MM-DD')
    .required('startDate is required'),

  endDate: yup
    .string()
    .transform((value) => {
      if (value) {
        const trimmedValue = value.trim();
        return trimmedValue.split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    })
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid endDate format. Use YYYY-MM-DD')
    .required('endDate is required')
    .test(
      'date-range',
      'startDate must be before or equal to endDate',
      function (endDate) {
        const { startDate } = this.parent;
        if (!startDate || !endDate) return true;
        return new Date(startDate) <= new Date(endDate);
      }
    ),

  limit: yup
    .number()
    .integer('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(10, 'Limit cannot exceed 10')
    .default(3)
    .optional(),
});