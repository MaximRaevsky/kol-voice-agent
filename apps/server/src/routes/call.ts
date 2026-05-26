import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  StartCallMessageSchema,
  CustomerUtteranceMessageSchema,
  EndCallMessageSchema,
  UseCaseSchema,
  type ServerMessage,
} from '@kol/shared';
import { leadRepo, playbookRepo, activityRepo } from '../db/index.js';
import {
  createSession,
  getSession,
  processUtterance,
  endSession,
  getGreeting,
  isLlmAvailable,
} from '../domain/agent/index.js';

export const callRouter = Router();

// ============================================
// Request Schemas (extending wire schemas)
// ============================================

const StartCallRequestSchema = z.object({
  leadId: z.string().uuid(),
  useCase: UseCaseSchema.default('OUTBOUND_SALES_HE'),
  tone: z.number().min(0).max(100).default(50), // 0=formal, 100=friendly
});

const UtteranceRequestSchema = z.object({
  sessionId: z.string().uuid(),
  text: z.string().min(1),
  source: z.enum(['voice', 'typed']).default('typed'),
  tone: z.number().min(0).max(100).default(50), // 0=formal, 100=friendly
});

const EndCallRequestSchema = z.object({
  sessionId: z.string().uuid(),
});

// ============================================
// POST /api/call/start
// ============================================

callRouter.post('/start', async (req: Request, res: Response) => {
  try {
    // Validate request
    const parsed = StartCallRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { leadId, useCase, tone } = parsed.data;

    // Get lead
    const lead = leadRepo.getById(leadId);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Get playbook
    const playbook = playbookRepo.get(useCase);
    if (!playbook) {
      res.status(404).json({ error: 'Playbook not found for use case' });
      return;
    }

    // Create session
    const session = createSession(lead, useCase);

    // Get initial greeting (with tone adjustment)
    const greeting = getGreeting(lead, playbook, tone);

    // Build initial events
    const events: ServerMessage[] = [
      {
        type: 'CALL_STATUS',
        sessionId: session.sessionId,
        status: 'CONNECTED',
      },
      {
        type: 'AGENT_RESPONSE',
        sessionId: session.sessionId,
        text: greeting,
        state: 'GREETING',
        shouldSpeak: true,
      },
      {
        type: 'TRANSCRIPT_APPEND',
        sessionId: session.sessionId,
        role: 'agent',
        text: greeting,
        ts: Date.now(),
      },
    ];

    res.json({
      sessionId: session.sessionId,
      leadId: lead.id,
      useCase,
      llmEnabled: isLlmAvailable(),
      events,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/call/utterance
// ============================================

callRouter.post('/utterance', async (req: Request, res: Response) => {
  try {
    // Validate request
    const parsed = UtteranceRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { sessionId, text, source, tone } = parsed.data;

    // Get session
    const session = getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Get lead and playbook
    const lead = leadRepo.getById(session.leadId);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    const playbook = playbookRepo.get(session.useCase);
    if (!playbook) {
      res.status(404).json({ error: 'Playbook not found' });
      return;
    }

    // Build events list
    const events: ServerMessage[] = [];

    // Add customer transcript
    events.push({
      type: 'TRANSCRIPT_APPEND',
      sessionId,
      role: 'customer',
      text,
      ts: Date.now(),
    });

    // Update status to listening
    events.push({
      type: 'CALL_STATUS',
      sessionId,
      status: 'LISTENING',
    });

    // Process utterance with AI-first approach
    const { response, session: updatedSession, decision } = await processUtterance(
      sessionId,
      text,
      lead,
      playbook,
      true, // useLlm
      tone  // 0=formal, 100=friendly
    );
    
    // Update status to speaking
    events.push({
      type: 'CALL_STATUS',
      sessionId,
      status: 'SPEAKING',
    });

    // Add agent response
    if (response.text) {
      events.push({
        type: 'AGENT_RESPONSE',
        sessionId,
        text: response.text,
        state: response.nextState,
        shouldSpeak: true,
      });

      events.push({
        type: 'TRANSCRIPT_APPEND',
        sessionId,
        role: 'agent',
        text: response.text,
        ts: Date.now(),
      });
    }

    // Check for CRM update action
    const crmAction = response.actions.find((a) => a.type === 'logCrmActivity');
    if (crmAction) {
      // Get the most recent activity
      const activities = activityRepo.listByLead(lead.id);
      const latestActivity = activities[activities.length - 1];
      if (latestActivity) {
        events.push({
          type: 'CRM_UPDATED',
          sessionId,
          activity: latestActivity,
        });
      }
    }

    // If call ended, add final status
    if (response.shouldEnd) {
      events.push({
        type: 'CALL_STATUS',
        sessionId,
        status: 'ENDED',
      });
    }

    // Full debug info for browser console
    const debugInfo = {
      // AI Decision
      ai: decision ? {
        customerMeaning: decision.customerMeaning,
        reasoning: decision.reasoning,
        response: decision.customResponse?.substring(0, 50) || null,
        shouldBook: decision.shouldBookMeeting,
        shouldEnd: decision.shouldEndCall,
      } : null,
      
      // State transition
      state: {
        previous: session.agentState,
        next: response.nextState,
      },
      
      // Session Context
      session: {
        askedCount: updatedSession.askedCount,
        transcriptLength: updatedSession.transcript.length,
        hasBookedSlot: !!updatedSession.selectedSlot,
        bookedSlot: updatedSession.selectedSlot?.displayText || null,
      },
      
      // Final Response
      output: {
        text: response.text,
        ended: response.shouldEnd,
        outcome: response.outcome || null,
      },
    };

    res.json({
      sessionId,
      state: response.nextState,
      ended: response.shouldEnd,
      outcome: response.outcome || null,
      events,
      debug: debugInfo,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// POST /api/call/end
// ============================================

callRouter.post('/end', async (req: Request, res: Response) => {
  try {
    // Validate request
    const parsed = EndCallRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { sessionId } = parsed.data;

    // Get and end session
    const session = endSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Get activity if any was created
    const activities = activityRepo.listByLead(session.leadId);
    const sessionActivities = activities.filter((a) => a.sessionId === sessionId);
    const activity = sessionActivities[sessionActivities.length - 1] || null;

    // Build events
    const events: ServerMessage[] = [
      {
        type: 'CALL_STATUS',
        sessionId,
        status: 'ENDED',
      },
    ];

    if (activity) {
      events.push({
        type: 'CRM_UPDATED',
        sessionId,
        activity,
      });
    }

    res.json({
      sessionId,
      outcome: activity?.outcome || 'OTHER',
      duration: session.endTime
        ? Math.round((session.endTime - session.startTime) / 1000)
        : 0,
      activity,
      events,
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// GET /api/call/session/:sessionId
// ============================================

callRouter.get('/session/:sessionId', (req: Request, res: Response) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json({
    sessionId: session.sessionId,
    leadId: session.leadId,
    useCase: session.useCase,
    state: session.agentState,
    transcript: session.transcript,
    askedCount: session.askedCount,
    proposedSlots: session.proposedSlots || null,
    selectedSlot: session.selectedSlot || null,
    startTime: session.startTime,
    endTime: session.endTime || null,
  });
});

