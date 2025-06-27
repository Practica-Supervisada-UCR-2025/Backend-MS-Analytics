import * as yup from 'yup';

export interface ReportedPostsQuery {
  interval?: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
}

const isValidDateString = (value: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime()) && value === date.toISOString().split('T')[0];
};

const createDateField = (fieldName: string, fallbackDaysAgo = 0) =>
  yup
    .string()
    .transform((value) => {
      if (!value) return value;
      return value.split('T')[0]; // remove time if exists
    })
    .default(() => {
      const date = new Date();
      date.setDate(date.getDate() - fallbackDaysAgo);
      return date.toISOString().split('T')[0];
    })
    .test(`${fieldName}-format`, `Invalid ${fieldName} format. Use YYYY-MM-DD`, function (value) {
      return value ? /^\d{4}-\d{2}-\d{2}$/.test(value) : false;
    })
    .test(`${fieldName}-valid`, `Invalid ${fieldName}`, function (value) {
      return value ? isValidDateString(value) : false;
    });

export const reportedPostsQuerySchema = yup
  .object({
    interval: yup
      .string()
      .oneOf(['daily', 'weekly', 'monthly'], 'Invalid interval. Must be daily, weekly, or monthly')
      .default('daily'),
    startDate: createDateField('startDate', 30).required('startDate is required'),
    endDate: createDateField('endDate').required('endDate is required'),
  })
  .test('date-range', 'startDate must be before or equal to endDate', function (value) {
    const { startDate, endDate } = value;
    if (!startDate || !endDate) return true; // let required rules handle it
    return new Date(startDate) <= new Date(endDate);
  });
