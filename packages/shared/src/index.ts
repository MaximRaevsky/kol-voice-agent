// ============================================
// Domain Types
// ============================================

// Use Cases
export {
  UseCaseSchema,
  type UseCase,
  DEFAULT_USE_CASE,
  USE_CASE_INFO,
} from './domain/useCase.js';

// Call Outcomes
export {
  CallOutcomeSchema,
  type CallOutcome,
  OUTCOME_INFO,
} from './domain/callOutcome.js';

// Leads
export {
  LeadStatusSchema,
  type LeadStatus,
  LeadSchema,
  type Lead,
  CreateLeadSchema,
  type CreateLead,
  UpdateLeadSchema,
  type UpdateLead,
} from './domain/lead.js';

// Calendar Slots
export {
  SlotStatusSchema,
  type SlotStatus,
  CalendarSlotSchema,
  type CalendarSlot,
  CreateSlotSchema,
  type CreateSlot,
  SlotDisplaySchema,
  type SlotDisplay,
} from './domain/calendarSlot.js';

// CRM Activities
export {
  ActivityTypeSchema,
  type ActivityType,
  CrmActivitySchema,
  type CrmActivity,
  type CrmActivity as Activity, // Alias for backward compat
  CreateActivitySchema,
  type CreateActivity,
} from './domain/crmActivity.js';

// Playbooks
export {
  PlaybookSchema,
  type Playbook,
  CreatePlaybookSchema,
  type CreatePlaybook,
  UpdatePlaybookSchema,
  type UpdatePlaybook,
  DEFAULT_PLAYBOOK_HE,
} from './domain/playbook.js';

// ============================================
// Wire Messages - Client → Server
// ============================================

export {
  // Individual message schemas
  SetUseCaseMessageSchema,
  type SetUseCaseMessage,
  GetLeadsMessageSchema,
  type GetLeadsMessage,
  GetPlaybookMessageSchema,
  type GetPlaybookMessage,
  UpdatePlaybookMessageSchema,
  type UpdatePlaybookMessage,
  StartCallMessageSchema,
  type StartCallMessage,
  CustomerUtteranceMessageSchema,
  type CustomerUtteranceMessage,
  EndCallMessageSchema,
  type EndCallMessage,
  GetMetricsMessageSchema,
  type GetMetricsMessage,
  GetSlotsMessageSchema,
  type GetSlotsMessage,
  // Union type
  ClientMessageSchema,
  type ClientMessage,
  // Parse helpers
  parseClientMessage,
  safeParseClientMessage,
} from './wire/clientMessages.js';

// ============================================
// Wire Messages - Server → Client
// ============================================

export {
  // Enums
  CallStatusSchema,
  type CallStatus,
  AgentStateSchema,
  type AgentState,
  TranscriptRoleSchema,
  type TranscriptRole,
  // Individual message schemas
  FeatureFlagsMessageSchema,
  type FeatureFlagsMessage,
  LeadsMessageSchema,
  type LeadsMessage,
  PlaybookMessageSchema,
  type PlaybookMessage,
  PlaybookUpdatedMessageSchema,
  type PlaybookUpdatedMessage,
  CallStatusMessageSchema,
  type CallStatusMessage,
  TranscriptAppendMessageSchema,
  type TranscriptAppendMessage,
  AgentResponseMessageSchema,
  type AgentResponseMessage,
  CrmUpdatedMessageSchema,
  type CrmUpdatedMessage,
  MetricsMessageSchema,
  type MetricsMessage,
  SlotsMessageSchema,
  type SlotsMessage,
  ErrorMessageSchema,
  type ErrorMessage,
  // Union type
  ServerMessageSchema,
  type ServerMessage,
  // Parse helpers
  parseServerMessage,
  safeParseServerMessage,
} from './wire/serverMessages.js';
