import { z } from 'zod';

export const updateEmailSchema = z.object({
  email: z.email(),
});

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
