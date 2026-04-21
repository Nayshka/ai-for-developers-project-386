import type { FastifyInstance } from 'fastify';

import { createBooking } from '../domain/bookings.js';
import { createBookingSchema, parseBody } from '../shared/validation.js';

export function registerBookingsRoutes(app: FastifyInstance) {
  app.post('/bookings', async (request) => {
    const body = parseBody(createBookingSchema, request.body);
    return createBooking(app.storage, body, app.now());
  });
}
