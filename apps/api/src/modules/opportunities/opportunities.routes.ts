import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

export const opportunitiesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      data: [],
      meta: {
        total: 0,
        page: 1,
      },
    });
  });

  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send({
      success: true,
      data: {
        id,
        title: 'Senior React Native Engineer',
        organization: 'Raycast',
      },
    });
  });

  fastify.post('/search', async (request, reply) => {
    const { prompt } = request.body as { prompt: string };
    return reply.send({
      success: true,
      data: {
        interpretedPrompt: prompt,
        results: [],
      },
    });
  });
};
