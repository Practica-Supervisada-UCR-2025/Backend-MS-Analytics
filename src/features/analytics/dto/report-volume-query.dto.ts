import * as yup from 'yup';
import { BadRequestError } from '../../../utils/errors/api-error';

// Define the schema
export const reportVolumeQuerySchema = yup.object({
  interval: yup
    .string()
    .oneOf(['daily', 'weekly', 'monthly'], 'Invalid interval. Must be daily, weekly, or monthly')
    .default('daily'),
    
  startDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid startDate format. Use YYYY-MM-DD')
    .transform((value) => {
      if (!value) {
        // Default to 30 days before endDate or today
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 30);
        return endDate.toISOString().split('T')[0];
      }
      return value;
    }),
    
  endDate: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Invalid endDate format. Use YYYY-MM-DD')
    .transform((value) => {
      if (!value) {
        // Default to today
        return new Date().toISOString().split('T')[0];
      }
      return value;
    })
    .test(
      'date-range',
      'startDate must be before or equal to endDate',
      function(endDate) {
        const { startDate } = this.parent;
        if (!startDate || !endDate) return true;
        return new Date(startDate) <= new Date(endDate);
      }
    )
});

export type ReportVolumeQueryDto = yup.InferType<typeof reportVolumeQuerySchema>;

export const validateReportVolumeQuery = async (query: any): Promise<ReportVolumeQueryDto> => {
  try {
    // If no dates are provided, set defaults
    if (!query.startDate && !query.endDate) {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      query.endDate = endDate;
      query.startDate = startDate.toISOString().split('T')[0];
    }
    // If only end date is provided, set start date
    else if (!query.startDate && query.endDate) {
      const startDate = new Date(query.endDate);
      startDate.setDate(startDate.getDate() - 30);
      query.startDate = startDate.toISOString().split('T')[0];
    }
    // If only start date is provided, set end date
    else if (query.startDate && !query.endDate) {
      query.endDate = new Date().toISOString().split('T')[0];
    }
    
    return await reportVolumeQuerySchema.validate(query, {
      abortEarly: false,
      stripUnknown: true
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new BadRequestError('Validation error', error.errors);
    }
    throw new BadRequestError('Invalid query parameters');
  }
};