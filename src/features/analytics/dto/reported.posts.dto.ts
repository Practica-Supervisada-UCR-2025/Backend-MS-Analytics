import * as yup from 'yup';

export interface ReportedPostsQuery {
  interval: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

export const reportedPostsQuerySchema = yup.object({
  interval: yup
    .string()
    .oneOf(['daily', 'weekly', 'monthly'], 'Invalid interval. Must be daily, weekly, or monthly')
    .default('daily'),

  startDate: yup
    .string()
    .transform((value) => {
      if (value) {
        return value.split('T')[0];
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
        return value.split('T')[0];
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
    )
});