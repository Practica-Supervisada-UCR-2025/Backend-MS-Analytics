import { z } from 'zod';

const isValidDate = (val: string): boolean => {
  const [day, month, year] = val.split('-').map(Number);

  if (!day || !month || !year) return false;

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const validDate = z
  .string()
  .regex(/^\d{2}-\d{2}-\d{4}$/, 'Invalid date format. Use DD-MM-YYYY')
  .refine(isValidDate, {
    message: 'Invalid calendar date',
  });

export const statsQuerySchema = z.object({
  start_date: validDate,
  end_date: validDate,
  period: z.enum(['daily', 'weekly', 'monthly']),
});

export type StatsQueryDTO = z.infer<typeof statsQuerySchema>;
