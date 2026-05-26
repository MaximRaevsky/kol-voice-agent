import type { Lead, Playbook, UseCase, AgentState, CallOutcome, SlotDisplay } from '@kol/shared';

// ============================================
// Session State
// ============================================

export interface TranscriptEntry {
  role: 'agent' | 'customer';
  text: string;
  ts: number;
}

export interface SessionState {
  sessionId: string;
  leadId: string;
  useCase: UseCase;
  agentState: AgentState;
  transcript: TranscriptEntry[];
  askedCount: number;
  selectedSlot?: SlotDisplay;
  proposedSlots?: SlotDisplay[];
  startTime: number;
  endTime?: number;
  
  // Qualification data extracted by AI during conversation
  qualification?: {
    role?: string;
    teamSize?: string;
    challenge?: string;
  };
}

// ============================================
// Agent Response
// ============================================

export interface AgentResponse {
  text: string;
  nextState: AgentState;
  actions: Array<{ type: string; payload?: Record<string, unknown> }>;
  shouldEnd: boolean;
  outcome?: CallOutcome;
}
