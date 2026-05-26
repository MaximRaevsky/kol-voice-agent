import { z } from 'zod';

// ============================================
// Calendar Slot Status
// ============================================

export const SlotStatusSchema = z.enum([
  'AVAILABLE',
  'BOOKED',
  'BLOCKED',
]);

export type SlotStatus = z.infer<typeof SlotStatusSchema>;

// ============================================
// Calendar Slot
// ============================================

export const CalendarSlotSchema = z.object({
  id: z.string(),
  startTime: z.number(), // Unix timestamp ms
  endTime: z.number(),
  status: SlotStatusSchema,
  leadId: z.string().uuid().optional(), // If booked
  activityId: z.string().uuid().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type CalendarSlot = z.infer<typeof CalendarSlotSchema>;

// For creating slots
export const CreateSlotSchema = z.object({
  startTime: z.number(),
  endTime: z.number(),
  status: SlotStatusSchema.default('AVAILABLE'),
});

export type CreateSlot = z.infer<typeof CreateSlotSchema>;

// Human-readable slot display
export const SlotDisplaySchema = z.object({
  id: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  displayText: z.string(), // e.g., "יום שני, 10:00"
  dayOfWeek: z.string(),
  time: z.string(),
  date: z.string(),
});

export type SlotDisplay = z.infer<typeof SlotDisplaySchema>;

