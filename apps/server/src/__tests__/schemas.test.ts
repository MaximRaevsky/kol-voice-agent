/**
 * Schema Validation Tests
 * 
 * Tests for AIDecisionSchema and related Zod schemas.
 * Verifies that the schema correctly validates/rejects input.
 */

import { describe, it, expect } from 'vitest';
import { AIDecisionSchema } from '../domain/agent/aiDecider.js';

describe('AIDecisionSchema', () => {
  describe('Valid decisions', () => {
    it('should accept a complete valid decision', () => {
      const validDecision = {
        customerMeaning: 'Customer agreed to the meeting',
        nextState: 'ENDED',
        customResponse: 'מצוין! נקבע לך את הפגישה.',
        shouldBookMeeting: true,
        selectedSlotIndex: 2,
        shouldEndCall: true,
        callOutcome: 'MEETING_BOOKED',
        extractedQualification: {
          role: 'מנהל מכירות',
          teamSize: '5',
          challenge: 'איתור לידים',
        },
        reasoning: 'Customer confirmed the proposed slot',
      };

      const result = AIDecisionSchema.safeParse(validDecision);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.callOutcome).toBe('MEETING_BOOKED');
        expect(result.data.shouldBookMeeting).toBe(true);
      }
    });

    it('should accept a minimal decision with defaults', () => {
      const minimalDecision = {};

      const result = AIDecisionSchema.safeParse(minimalDecision);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customerMeaning).toBe('Unknown');
        expect(result.data.nextState).toBe('PITCH');
        expect(result.data.shouldBookMeeting).toBe(false);
        expect(result.data.shouldEndCall).toBe(false);
        expect(result.data.reasoning).toBe('');
      }
    });

    it('should accept callback requested outcome', () => {
      const callbackDecision = {
        nextState: 'ENDED',
        customResponse: 'בסדר, אחזור אליך מחר בבוקר.',
        shouldEndCall: true,
        callOutcome: 'CALLBACK_REQUESTED',
      };

      const result = AIDecisionSchema.safeParse(callbackDecision);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.callOutcome).toBe('CALLBACK_REQUESTED');
        expect(result.data.shouldBookMeeting).toBe(false);
      }
    });

    it('should accept not interested outcome', () => {
      const notInterestedDecision = {
        nextState: 'ENDED',
        customResponse: 'אני מבין, תודה על הזמן.',
        shouldEndCall: true,
        callOutcome: 'NOT_INTERESTED',
      };

      const result = AIDecisionSchema.safeParse(notInterestedDecision);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.callOutcome).toBe('NOT_INTERESTED');
      }
    });
  });

  describe('Invalid decisions', () => {
    it('should reject invalid nextState', () => {
      const invalidDecision = {
        nextState: 'INVALID_STATE',
      };

      const result = AIDecisionSchema.safeParse(invalidDecision);
      expect(result.success).toBe(false);
    });

    it('should reject invalid callOutcome', () => {
      const invalidDecision = {
        callOutcome: 'INVALID_OUTCOME',
      };

      const result = AIDecisionSchema.safeParse(invalidDecision);
      expect(result.success).toBe(false);
    });

    it('should reject shouldBookMeeting as string', () => {
      const invalidDecision = {
        shouldBookMeeting: 'true', // should be boolean
      };

      const result = AIDecisionSchema.safeParse(invalidDecision);
      expect(result.success).toBe(false);
    });

    it('should reject selectedSlotIndex as string', () => {
      const invalidDecision = {
        selectedSlotIndex: '2', // should be number
      };

      const result = AIDecisionSchema.safeParse(invalidDecision);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle null values for optional nullable fields', () => {
      const decisionWithNulls = {
        customResponse: null,
        selectedSlotIndex: null,
        callOutcome: null,
        extractedQualification: null,
      };

      const result = AIDecisionSchema.safeParse(decisionWithNulls);
      expect(result.success).toBe(true);
    });

    it('should handle empty customResponse', () => {
      const decisionWithEmpty = {
        customResponse: '',
      };

      const result = AIDecisionSchema.safeParse(decisionWithEmpty);
      expect(result.success).toBe(true);
    });
  });
});

// Test LeadSchema from shared package
import { LeadSchema, LeadStatusSchema } from '@kol/shared';

describe('LeadSchema', () => {
  it('should accept a valid lead', () => {
    const validLead = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'דוד כהן',
      phone: '+972-52-1234567',
      company: 'טכנולוגיות אינוביט',
      title: 'מנהל מכירות',
      email: 'david@example.com',
      status: 'NEW',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = LeadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
  });

  it('should reject lead with invalid status', () => {
    const invalidLead = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Test',
      phone: '123',
      status: 'INVALID_STATUS',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = LeadSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });

  it('should reject lead with invalid UUID', () => {
    const invalidLead = {
      id: 'not-a-uuid',
      name: 'Test',
      phone: '123',
      status: 'NEW',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = LeadSchema.safeParse(invalidLead);
    expect(result.success).toBe(false);
  });
});

describe('LeadStatusSchema', () => {
  it('should accept all valid statuses', () => {
    const validStatuses = [
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'MEETING_SCHEDULED',
      'NOT_INTERESTED',
      'DO_NOT_CALL',
    ];

    for (const status of validStatuses) {
      const result = LeadStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const result = LeadStatusSchema.safeParse('INVALID');
    expect(result.success).toBe(false);
  });
});

// Test CallOutcomeSchema
import { CallOutcomeSchema } from '@kol/shared';

describe('CallOutcomeSchema', () => {
  it('should accept all valid outcomes', () => {
    const validOutcomes = [
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
    ];

    for (const outcome of validOutcomes) {
      const result = CallOutcomeSchema.safeParse(outcome);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid outcome', () => {
    const result = CallOutcomeSchema.safeParse('INVALID_OUTCOME');
    expect(result.success).toBe(false);
  });
});
