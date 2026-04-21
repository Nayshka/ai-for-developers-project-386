import cors from '@fastify/cors';
import fastify from 'fastify';

import { registerBookingsRoutes } from './routes/bookingsRoutes.js';
import { registerEventTypesRoutes } from './routes/eventTypesRoutes.js';
import { registerOwnerRoutes } from './routes/ownerRoutes.js';
import { ApiError } from './shared/errors.js';
import { createStorage, type AppStorage } from './storage.js';

declare module 'fastify' {
  interface FastifyInstance {
    storage: AppStorage;
    now: () => Date;
  }
}

type BuildAppOptions = {
  storage?: AppStorage;
  logger?: boolean;
  now?: () => Date;
};

export function buildApp(options: BuildAppOptions = {}) {
  const app = fastify({
    logger: options.logger ?? false,
  });

  app.decorate('storage', options.storage ?? createStorage());
  app.decorate('now', options.now ?? (() => new Date()));

  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      reply.status(error.statusCode).send(error.toResponse());
      return;
    }

    app.log.error(error);
    reply.status(500).send({
      code: 'internal_error',
      message: 'Внутренняя ошибка сервера.',
    });
  });

  registerEventTypesRoutes(app);
  registerBookingsRoutes(app);
  registerOwnerRoutes(app);

  return app;
}
