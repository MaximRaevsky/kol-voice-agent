import { z } from 'zod';
import { CallOutcomeSchema } from './callOutcome.js';

// ============================================
// Activity Type
// ============================================

export const ActivityTypeSchema = z.enum([
  'OUTBOUND_CALL',
  'INBOUND_CALL',
  'MEETING',
  'EMAIL',
  'NOTE',
]);

export type ActivityType = z.infer<typeof ActivityTypeSchema>;

// ============================================
// CRM Activity
// ============================================

export const CrmActivitySchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  sessionId: z.string(),
  type: ActivityTypeSchema,
  outcome: CallOutcomeSchema,
  summary: z.string(),
  notes: z.string().optional(),
  duration: z.number(), // seconds
  transcript: z.string().optional(),
  meetingSlotId: z.string().optional(),
  createdAt: z.number(),
});

export type CrmActivity = z.infer<typeof CrmActivitySchema>;

// For creating activities
export const CreateActivitySchema = CrmActivitySchema.omit({
  id: true,
  createdAt: true,
});

export type CreateActivity = z.infer<typeof CreateActivitySchema>;

