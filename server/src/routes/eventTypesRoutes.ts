import type { FastifyInstance } from 'fastify';

import { listEventTypeSlots } from '../domain/slots.js';
import { getEventType, listEventTypes } from '../domain/eventTypes.js';

export function registerEventTypesRoutes(app: FastifyInstance) {
  app.get('/event-types', async () => ({
    items: listEventTypes(app.storage),
  }));

  app.get<{ Params: { eventTypeId: string } }>(
    '/event-types/:eventTypeId',
    async (request) => getEventType(app.storage, request.params.eventTypeId),
  );

  app.get<{ Params: { eventTypeId: string } }>(
    '/event-types/:eventTypeId/slots',
    async (request) => ({
      items: listEventTypeSlots(app.storage, request.params.eventTypeId, app.now()),
    }),
  );
}
