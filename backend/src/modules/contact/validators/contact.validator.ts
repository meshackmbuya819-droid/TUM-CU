import { z } from 'zod';

export const contactValidators = {
  create: z.object({
    name: z.string().trim().min(2).max(150),
    email: z.string().trim().email().max(190),
    phone: z.string().trim().max(30).optional().nullable(),
    subject: z.string().trim().min(2).max(255),
    message: z.string().trim().min(5).max(10000),
  }),
  update: z.object({
    status: z.enum(['new','read','replied','archived']).optional(),
    assigned_to: z.string().uuid().nullable().optional(),
  }),
};
