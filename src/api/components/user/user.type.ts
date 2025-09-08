import { z } from 'zod';
export const safeUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});
export type SafeUser = z.infer<typeof safeUserSchema>;