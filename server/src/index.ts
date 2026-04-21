import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 4010);
const host = process.env.HOST ?? '127.0.0.1';
const app = buildApp({ logger: true });

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
