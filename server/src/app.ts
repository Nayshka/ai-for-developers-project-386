import { existsSync } from 'node:fs';
import path from 'node:path';

import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
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
  const staticRoot = path.resolve(process.cwd(), 'dist');
  const hasStaticAssets = existsSync(path.join(staticRoot, 'index.html'));

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

  if (hasStaticAssets) {
    app.register(staticPlugin, {
      root: staticRoot,
      prefix: '/',
    });

    app.addHook('onRequest', (request, reply, done) => {
      const acceptsHtml = request.headers.accept?.includes('text/html') ?? false;
      const pathname = new URL(request.url, 'http://localhost').pathname;
      const looksLikeAsset = pathname.includes('.');

      if (request.method === 'GET' && acceptsHtml && !looksLikeAsset) {
        reply.sendFile('index.html');
        return;
      }

      done();
    });

    app.setNotFoundHandler((request, reply) => {
      const acceptsHtml = request.headers.accept?.includes('text/html') ?? false;

      if (request.method === 'GET' && acceptsHtml) {
        reply.sendFile('index.html');
        return;
      }

      reply.status(404).send({
        code: 'not_found',
        message: 'Ресурс не найден.',
      });
    });
  }

  return app;
}
