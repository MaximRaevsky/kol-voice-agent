import { z } from 'zod';
import { UseCaseSchema } from '../domain/useCase.js';
import { UpdatePlaybookSchema } from '../domain/playbook.js';

// ============================================
// Client → Server Messages
// ============================================

// SET_USE_CASE - Set active use case
export const SetUseCaseMessageSchema = z.object({
  type: z.literal('SET_USE_CASE'),
  useCase: UseCaseSchema,
});
export type SetUseCaseMessage = z.infer<typeof SetUseCaseMessageSchema>;

// GET_LEADS - Request leads list
export const GetLeadsMessageSchema = z.object({
  type: z.literal('GET_LEADS'),
});
export type GetLeadsMessage = z.infer<typeof GetLeadsMessageSchema>;

// GET_PLAYBOOK - Request playbook for use case
export const GetPlaybookMessageSchema = z.object({
  type: z.literal('GET_PLAYBOOK'),
  useCase: UseCaseSchema,
});
export type GetPlaybookMessage = z.infer<typeof GetPlaybookMessageSchema>;

// UPDATE_PLAYBOOK - Update playbook
export const UpdatePlaybookMessageSchema = z.object({
  type: z.literal('UPDATE_PLAYBOOK'),
  useCase: UseCaseSchema,
  playbook: UpdatePlaybookSchema,
});
export type UpdatePlaybookMessage = z.infer<typeof UpdatePlaybookMessageSchema>;

// START_CALL - Initiate call to lead
export const StartCallMessageSchema = z.object({
  type: z.literal('START_CALL'),
  leadId: z.string().uuid(),
  useCase: UseCaseSchema,
});
export type StartCallMessage = z.infer<typeof StartCallMessageSchema>;

// CUSTOMER_UTTERANCE - Customer speech/text
export const CustomerUtteranceMessageSchema = z.object({
  type: z.literal('CUSTOMER_UTTERANCE'),
  sessionId: z.string(),
  text: z.string().min(1),
  source: z.enum(['voice', 'typed']),
});
export type CustomerUtteranceMessage = z.infer<typeof CustomerUtteranceMessageSchema>;

// END_CALL - End current call
export const EndCallMessageSchema = z.object({
  type: z.literal('END_CALL'),
  sessionId: z.string(),
});
export type EndCallMessage = z.infer<typeof EndCallMessageSchema>;

// GET_METRICS - Request metrics
export const GetMetricsMessageSchema = z.object({
  type: z.literal('GET_METRICS'),
});
export type GetMetricsMessage = z.infer<typeof GetMetricsMessageSchema>;

// GET_SLOTS - Request available slots
export const GetSlotsMessageSchema = z.object({
  type: z.literal('GET_SLOTS'),
});
export type GetSlotsMessage = z.infer<typeof GetSlotsMessageSchema>;

// ============================================
// Union of all client messages
// ============================================

export const ClientMessageSchema = z.discriminatedUnion('type', [
  SetUseCaseMessageSchema,
  GetLeadsMessageSchema,
  GetPlaybookMessageSchema,
  UpdatePlaybookMessageSchema,
  StartCallMessageSchema,
  CustomerUtteranceMessageSchema,
  EndCallMessageSchema,
  GetMetricsMessageSchema,
  GetSlotsMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;

// ============================================
// Parse helper
// ============================================

export function parseClientMessage(data: unknown): ClientMessage {
  return ClientMessageSchema.parse(data);
}

export function safeParseClientMessage(data: unknown) {
  return ClientMessageSchema.safeParse(data);
}

