import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { opportunitiesRoutes } from './modules/opportunities/opportunities.routes';

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
  });

  // Health Check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'ProspectAI API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });

  // Register API modules under /api/v1
  await fastify.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(opportunitiesRoutes, { prefix: '/opportunities' });
    },
    { prefix: '/api/v1' }
  );

  return fastify;
}

async function start() {
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 ProspectAI API running at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
