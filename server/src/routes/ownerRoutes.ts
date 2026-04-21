import type { FastifyInstance } from 'fastify';

import { listOwnerBookings } from '../domain/bookings.js';
import { createEventType, listEventTypes, updateEventType } from '../domain/eventTypes.js';
import {
  createEventTypeSchema,
  parseBody,
  updateEventTypeSchema,
} from '../shared/validation.js';

export function registerOwnerRoutes(app: FastifyInstance) {
  app.get('/owner/event-types', async () => ({
    items: listEventTypes(app.storage),
  }));

  app.post('/owner/event-types', async (request) => {
    const body = parseBody(createEventTypeSchema, request.body);
    return createEventType(app.storage, body);
  });

  app.patch<{ Params: { eventTypeId: string } }>(
    '/owner/event-types/:eventTypeId',
    async (request) => {
      const body = parseBody(updateEventTypeSchema, request.body);
      return updateEventType(app.storage, request.params.eventTypeId, body);
    },
  );

  app.get('/owner/bookings', async () => ({
    items: listOwnerBookings(app.storage, app.now()),
  }));
}
