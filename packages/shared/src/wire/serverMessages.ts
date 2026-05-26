import { z } from 'zod';
import { UseCaseSchema } from '../domain/useCase.js';
import { LeadSchema } from '../domain/lead.js';
import { PlaybookSchema } from '../domain/playbook.js';
import { CrmActivitySchema } from '../domain/crmActivity.js';
import { CallOutcomeSchema } from '../domain/callOutcome.js';
import { SlotDisplaySchema } from '../domain/calendarSlot.js';

// ============================================
// Call Status
// ============================================

export const CallStatusSchema = z.enum([
  'DIALING',
  'CONNECTED',
  'LISTENING',
  'SPEAKING',
  'ENDED',
]);

export type CallStatus = z.infer<typeof CallStatusSchema>;

// ============================================
// Agent State (conversation flow)
// ============================================

export const AgentStateSchema = z.enum([
  'GREETING',
  'PITCH',
  'QUALIFY',
  'MEETING_PROPOSAL',
  'BOOKING',
  'CLOSING',
  'ENDED',
]);

export type AgentState = z.infer<typeof AgentStateSchema>;

// ============================================
// Transcript Role
// ============================================

export const TranscriptRoleSchema = z.enum(['agent', 'customer', 'system']);
export type TranscriptRole = z.infer<typeof TranscriptRoleSchema>;

// ============================================
// Server → Client Messages
// ============================================

// FEATURE_FLAGS - Server capabilities
export const FeatureFlagsMessageSchema = z.object({
  type: z.literal('FEATURE_FLAGS'),
  flags: z.object({
    browserSpeech: z.boolean(),
    httpTransport: z.boolean(),
    jsonStorage: z.boolean(),
    azureTtsEnabled: z.boolean().optional(),
    llmEnabled: z.boolean().optional(),
  }),
});
export type FeatureFlagsMessage = z.infer<typeof FeatureFlagsMessageSchema>;

// LEADS - List of leads
export const LeadsMessageSchema = z.object({
  type: z.literal('LEADS'),
  leads: z.array(LeadSchema),
});
export type LeadsMessage = z.infer<typeof LeadsMessageSchema>;

// PLAYBOOK - Playbook for use case
export const PlaybookMessageSchema = z.object({
  type: z.literal('PLAYBOOK'),
  useCase: UseCaseSchema,
  playbook: PlaybookSchema,
});
export type PlaybookMessage = z.infer<typeof PlaybookMessageSchema>;

// PLAYBOOK_UPDATED - Confirmation of playbook update
export const PlaybookUpdatedMessageSchema = z.object({
  type: z.literal('PLAYBOOK_UPDATED'),
  useCase: UseCaseSchema,
  success: z.boolean(),
});
export type PlaybookUpdatedMessage = z.infer<typeof PlaybookUpdatedMessageSchema>;

// CALL_STATUS - Call state change
export const CallStatusMessageSchema = z.object({
  type: z.literal('CALL_STATUS'),
  sessionId: z.string(),
  status: CallStatusSchema,
  leadId: z.string().uuid().optional(),
});
export type CallStatusMessage = z.infer<typeof CallStatusMessageSchema>;

// TRANSCRIPT_APPEND - New message in transcript
export const TranscriptAppendMessageSchema = z.object({
  type: z.literal('TRANSCRIPT_APPEND'),
  sessionId: z.string(),
  role: TranscriptRoleSchema,
  text: z.string(),
  ts: z.number(),
});
export type TranscriptAppendMessage = z.infer<typeof TranscriptAppendMessageSchema>;

// AGENT_RESPONSE - Agent response with state
export const AgentResponseMessageSchema = z.object({
  type: z.literal('AGENT_RESPONSE'),
  sessionId: z.string(),
  text: z.string(),
  state: AgentStateSchema,
  shouldSpeak: z.boolean().default(true),
});
export type AgentResponseMessage = z.infer<typeof AgentResponseMessageSchema>;

// CRM_UPDATED - CRM activity created/updated
export const CrmUpdatedMessageSchema = z.object({
  type: z.literal('CRM_UPDATED'),
  sessionId: z.string(),
  activity: CrmActivitySchema,
});
export type CrmUpdatedMessage = z.infer<typeof CrmUpdatedMessageSchema>;

// METRICS - Aggregated metrics
export const MetricsMessageSchema = z.object({
  type: z.literal('METRICS'),
  totals: z.object({
    totalCalls: z.number(),
    meetingsBooked: z.number(),
    conversionRate: z.number(),
    avgDuration: z.number(),
    todayCalls: z.number(),
    todayMeetings: z.number(),
  }),
  byOutcome: z.record(CallOutcomeSchema, z.number()),
});
export type MetricsMessage = z.infer<typeof MetricsMessageSchema>;

// SLOTS - Available meeting slots
export const SlotsMessageSchema = z.object({
  type: z.literal('SLOTS'),
  slots: z.array(SlotDisplaySchema),
});
export type SlotsMessage = z.infer<typeof SlotsMessageSchema>;

// ERROR - Error response
export const ErrorMessageSchema = z.object({
  type: z.literal('ERROR'),
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

// ============================================
// Union of all server messages
// ============================================

export const ServerMessageSchema = z.discriminatedUnion('type', [
  FeatureFlagsMessageSchema,
  LeadsMessageSchema,
  PlaybookMessageSchema,
  PlaybookUpdatedMessageSchema,
  CallStatusMessageSchema,
  TranscriptAppendMessageSchema,
  AgentResponseMessageSchema,
  CrmUpdatedMessageSchema,
  MetricsMessageSchema,
  SlotsMessageSchema,
  ErrorMessageSchema,
]);

export type ServerMessage = z.infer<typeof ServerMessageSchema>;

// ============================================
// Parse helpers
// ============================================

export function parseServerMessage(data: unknown): ServerMessage {
  return ServerMessageSchema.parse(data);
}

export function safeParseServerMessage(data: unknown) {
  return ServerMessageSchema.safeParse(data);
}

