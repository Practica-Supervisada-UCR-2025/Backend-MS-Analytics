import * as yup from 'yup';

export interface TopPostsQuery {
  range: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  limit?: number;
}

export interface PostDetail {
  id: string;
  userId: string;
  content: string | null;
  createdAt: string; 
  updatedAt: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mediaType: number | null;
  isActive: boolean;
  isEdited: boolean;
  status: number;
  commentCount: number;
}

export interface TopPostMetric {
  date: string;
  posts: PostDetail[];
}

const createDateField = (fieldName: string) =>
  yup
    .string()
    .transform((value) => {
      if (!value) return value;
      return value.split('T')[0];
    })
    .matches(/^\d{4}-\d{2}-\d{2}$/, `Invalid ${fieldName} format. Use YYYY-MM-DD`)
    .required(`${fieldName} is required`);

const baseSchema = yup.object({
  range: yup
    .string()
    .oneOf(['daily', 'weekly', 'monthly'], 'Invalid range. Must be daily, weekly, or monthly')
    .default('daily'),

  startDate: createDateField('startDate'),

  limit: yup
    .number()
    .integer('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(10, 'Limit cannot exceed 10')
    .default(3)
    .optional(),
});

export const topPostsQuerySchema = baseSchema.concat(
  yup.object({
    endDate: createDateField('endDate')
      .test(
        'date-range',
        'startDate must be before or equal to endDate',
        function (endDate) {
          const { startDate } = this.parent;
          if (!startDate || !endDate) return true;
          return new Date(startDate) <= new Date(endDate);
        }
      )
  })
);