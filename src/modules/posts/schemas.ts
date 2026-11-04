import { z } from 'zod';

export const tagQuerySchema = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .optional();

export const postIdSchema = z.coerce.number().int().positive();
