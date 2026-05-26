/**
 * Agent Service - AI-First Call Management
 * 
 * Uses a single AI brain (aiDecider) to make all conversation decisions.
 * Manages call sessions, booking, and CRM logging.
 */

import { randomUUID } from 'crypto';
import type { Lead, Playbook, UseCase, SlotDisplay, CrmActivity } from '@kol/shared';
import type { SessionState, AgentResponse, TranscriptEntry } from './types.js';
import { makeDecision, renderDecision, validateCustomResponse, type AIDecision } from './aiDecider.js';
import { slotRepo, activityRepo, leadRepo } from '../../db/index.js';
import { openaiProvider } from '../../providers/llm/index.js';

// In-memory session store
const sessions = new Map<string, SessionState>();

// ============================================
// Session Management
// ============================================

export function createSession(lead: Lead, useCase: UseCase): SessionState {
  const session: SessionState = {
    sessionId: randomUUID(),
    leadId: lead.id,
    useCase,
    agentState: 'GREETING',
    transcript: [],
    askedCount: 0,
    startTime: Date.now(),
  };

  sessions.set(session.sessionId, session);
  return session;
}

export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

export function getGreeting(lead: Lead, playbook: Playbook, tone: number = 50): string {
  const firstName = lead.name.split(' ')[0];
  
  // Adjust greeting based on tone (0=formal, 100=friendly)
  if (tone < 30) {
    // Formal
    return `שלום ${firstName}, כאן אלכס מחברת קול. ראיתי שהשארת פרטים באתר שלנו, האם יש לך רגע לשוחח?`;
  } else if (tone < 70) {
    // Balanced
    return `היי ${firstName}, זה אלכס מקול. ראיתי שהשארת פרטים באתר שלנו, יש לך דקה?`;
  } else {
    // Friendly
    return `היי ${firstName}! מה קורה? זה אלכס מקול, ראיתי שהשארת פרטים באתר. יש לך דקה?`;
  }
}

export function endSession(sessionId: string): SessionState | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  session.endTime = Date.now();
  session.agentState = 'ENDED';
  sessions.set(sessionId, session);
  return session;
}

export function clearSessions(): void {
  sessions.clear();
}

// ============================================
// Slot Helpers
// ============================================

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function slotToDisplay(slot: { id: string; startTime: number; endTime: number }): SlotDisplay {
  const start = new Date(slot.startTime);
  return {
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    displayText: `יום ${HEBREW_DAYS[start.getDay()]} בשעה ${start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
    dayOfWeek: HEBREW_DAYS[start.getDay()],
    time: start.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    date: start.toLocaleDateString('he-IL'),
  };
}

function getAvailableSlots(): SlotDisplay[] {
  // Get all available slots so AI can offer any day the customer asks for
  const rawSlots = slotRepo.listAvailable();
  return rawSlots.map(slotToDisplay);
}

// ============================================
// Main Processing Flow
// ============================================

export async function processUtterance(
  sessionId: string,
  customerText: string,
  lead: Lead,
  playbook: Playbook,
  useLlm: boolean = true,
  tone: number = 50  // 0=formal, 100=friendly
): Promise<{ 
  response: AgentResponse; 
  session: SessionState; 
  decision?: AIDecision;
}> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  // Add customer utterance to transcript
  session.transcript.push({
    role: 'customer',
    text: customerText,
    ts: Date.now(),
  });

  // Get all available slots for scheduling context
  const availableSlots = session.proposedSlots || getAvailableSlots();
  if (!session.proposedSlots) {
    session.proposedSlots = availableSlots;
  }

  // Let AI make the decision
  const decision = await makeDecision(
    lead,
    session,
    customerText,
    playbook,
    availableSlots,
    tone
  );

  // Render the response
  let responseText = renderDecision(decision, lead, availableSlots);

  // Validate response with safety checker
  if (decision.customResponse) {
    const validation = await validateCustomResponse(
      decision.customResponse,
      lead,
      `State: ${session.agentState}, Customer said: ${customerText}`
    );
    if (!validation.valid && validation.improved) {
      responseText = validation.improved;
    }
  }

  // Extract and store qualification data
  if (decision.extractedQualification) {
    if (!session.qualification) session.qualification = {};
    if (decision.extractedQualification.role) {
      session.qualification.role = decision.extractedQualification.role;
    }
    if (decision.extractedQualification.teamSize) {
      session.qualification.teamSize = decision.extractedQualification.teamSize;
    }
    if (decision.extractedQualification.challenge) {
      session.qualification.challenge = decision.extractedQualification.challenge;
    }
  }

  // Execute booking if needed
  if (decision.shouldBookMeeting && typeof decision.selectedSlotIndex === 'number') {
    const slot = availableSlots[decision.selectedSlotIndex];
    if (slot) {
      slotRepo.book(slot.id, lead.id);
      session.selectedSlot = slot;
      leadRepo.updateStatus(lead.id, 'MEETING_SCHEDULED');
      decision.shouldEndCall = true;
      decision.callOutcome = 'MEETING_BOOKED';
    }
  }

  // Log CRM activity if ending
  if (decision.shouldEndCall && decision.callOutcome) {
    activityRepo.create({
      leadId: lead.id,
      sessionId: session.sessionId,
      type: 'OUTBOUND_CALL',
      outcome: decision.callOutcome as CrmActivity['outcome'],
      summary: decision.customerMeaning,
      notes: decision.reasoning,
      duration: Math.round((Date.now() - session.startTime) / 1000),
      transcript: session.transcript.map(t => `${t.role}: ${t.text}`).join('\n'),
    });
    leadRepo.updateLastContact(lead.id);
  }

  // Update session state
  session.agentState = decision.nextState;
  
  // Track qualification questions (when in QUALIFY state)
  if (decision.nextState === 'QUALIFY') {
    session.askedCount++;
  }

  // Add agent response to transcript
  if (responseText) {
    session.transcript.push({
      role: 'agent',
      text: responseText,
      ts: Date.now(),
    });
  }

  if (decision.shouldEndCall) {
    session.endTime = Date.now();
  }

  sessions.set(sessionId, session);

  // Build response
  const response: AgentResponse = {
    text: responseText,
    nextState: decision.nextState,
    actions: [],
    shouldEnd: decision.shouldEndCall,
    outcome: decision.callOutcome ?? undefined,
  };

  return { response, session, decision };
}

// ============================================
// Check if LLM is available
// ============================================

export function isLlmAvailable(): boolean {
  return openaiProvider.isAvailable();
}

