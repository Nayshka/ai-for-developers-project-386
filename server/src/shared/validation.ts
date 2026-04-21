import { z } from 'zod';

import { validationError } from './errors.js';

const isoDateTimeSchema = z.string().datetime({ offset: true });

export const createEventTypeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  durationMinutes: z.number().int().min(1),
});

export const updateEventTypeSchema = createEventTypeSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Передайте хотя бы одно поле для обновления.',
);

export const createBookingSchema = z.object({
  eventTypeId: z.string().trim().min(1),
  range: z.object({
    startAt: isoDateTimeSchema,
    endAt: isoDateTimeSchema,
  }),
  guest: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
  }),
});

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw validationError(result.error.issues.map((issue) => issue.message));
  }

  return result.data;
}
