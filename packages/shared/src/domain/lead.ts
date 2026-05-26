import { z } from 'zod';

// ============================================
// Lead Status
// ============================================

export const LeadStatusSchema = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'MEETING_SCHEDULED',
  'NOT_INTERESTED',
  'DO_NOT_CALL',
]);

export type LeadStatus = z.infer<typeof LeadStatusSchema>;

// ============================================
// Lead
// ============================================

export const LeadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().min(1),
  company: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional(),
  status: LeadStatusSchema,
  notes: z.string().optional(),
  lastContactAt: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Lead = z.infer<typeof LeadSchema>;

// For creating new leads
export const CreateLeadSchema = LeadSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: LeadStatusSchema.default('NEW'),
});

export type CreateLead = z.infer<typeof CreateLeadSchema>;

// For updating leads
export const UpdateLeadSchema = LeadSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type UpdateLead = z.infer<typeof UpdateLeadSchema>;
