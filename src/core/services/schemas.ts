import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  email: z.email(),
});

export const createCommentSchema = z.object({
  author_name: z.string().min(1).max(50),
  content: z.string().min(1),
});

export const tagQuerySchema = z
  .string()
  .regex(/^[a-z0-9-]+$/)
  .optional();

export const postIdSchema = z.coerce.number().int().positive();

export const updateEmailSchema = z.object({
  email: z.email(),
});

export const searchQuerySchema = z.string().catch('');

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
