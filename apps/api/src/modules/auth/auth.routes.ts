import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/signup', async (request, reply) => {
    const body = signupSchema.parse(request.body);
    const user = {
      id: `usr_${Date.now()}`,
      name: body.name,
      email: body.email,
      role: 'USER',
    };
    return reply.status(201).send({
      success: true,
      data: {
        user,
        token: 'mock_jwt_token_sample_2026',
      },
    });
  });

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    return reply.send({
      success: true,
      data: {
        user: {
          id: 'usr_alex_01',
          name: 'Alex Rivera',
          email: body.email,
        },
        token: 'mock_jwt_token_sample_2026',
      },
    });
  });

  fastify.post('/oauth/:provider', async (request, reply) => {
    const { provider } = request.params as { provider: string };
    return reply.send({
      success: true,
      data: {
        user: {
          id: 'usr_alex_01',
          name: 'Alex Rivera',
          email: 'alex.rivera.dev@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        },
        provider,
        token: 'mock_jwt_oauth_token',
      },
    });
  });
};
