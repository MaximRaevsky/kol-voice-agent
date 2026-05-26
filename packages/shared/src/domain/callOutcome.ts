import { z } from 'zod';

// ============================================
// Call Outcomes
// ============================================

export const CallOutcomeSchema = z.enum([
  'MEETING_BOOKED',
  'CALLBACK_REQUESTED',
  'NOT_INTERESTED',
  'NO_ANSWER',
  'WRONG_NUMBER',
  'DO_NOT_CALL',
  'VOICEMAIL',
  'BUSY',
  'IN_PROGRESS',
  'OTHER',
]);

export type CallOutcome = z.infer<typeof CallOutcomeSchema>;

// Outcome display info
export const OUTCOME_INFO: Record<CallOutcome, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  MEETING_BOOKED: { label: 'Meeting Booked', color: 'success' },
  CALLBACK_REQUESTED: { label: 'Callback Requested', color: 'warning' },
  NOT_INTERESTED: { label: 'Not Interested', color: 'neutral' },
  NO_ANSWER: { label: 'No Answer', color: 'info' },
  WRONG_NUMBER: { label: 'Wrong Number', color: 'error' },
  DO_NOT_CALL: { label: 'Do Not Call', color: 'error' },
  VOICEMAIL: { label: 'Voicemail', color: 'info' },
  BUSY: { label: 'Busy', color: 'info' },
  IN_PROGRESS: { label: 'In Progress', color: 'info' },
  OTHER: { label: 'Other', color: 'neutral' },
};

