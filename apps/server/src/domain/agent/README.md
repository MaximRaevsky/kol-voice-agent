# Agent Domain

Core AI conversation logic for the Hebrew voice agent.

## Architecture

```
                      ┌──────────────────┐
                      │   agentService   │
                      │  (orchestrator)  │
                      └────────┬─────────┘
                               │
                               ▼
┌─────────────┐  context  ┌──────────────┐  decision  ┌───────────┐
│   session   │ ────────► │  aiDecider   │ ─────────► │  actions  │
│   state     │           │   (GPT-4o)   │            │  booking  │
│  transcript │           └──────────────┘            │  CRM log  │
└─────────────┘                                       └───────────┘
```

## Files

### `aiDecider.ts` - The Brain

Single AI call that decides everything:

```typescript
interface AIDecision {
  customerMeaning: string;     // What did they mean?
  nextState: AgentState;       // Where to go next
  customResponse: string;      // Hebrew response text
  shouldBookMeeting: boolean;  // Book a slot?
  selectedSlotIndex: number;   // Which slot?
  shouldEndCall: boolean;      // End the call?
  callOutcome: CallOutcome;    // MEETING_BOOKED, etc.
  extractedQualification: {...}; // Role, team, challenge
}
```

**Key Functions:**
- `buildSystemPrompt(tone)` - Constructs the AI persona
- `buildUserPrompt(...)` - Builds context for decision
- `makeDecision(...)` - Calls GPT-4o
- `validateCustomResponse(...)` - Safety check

### `agentService.ts` - Session Manager

Manages call lifecycle:

```typescript
const sessions = new Map<string, SessionState>();

// Core functions
createSession(lead, useCase) → SessionState
getSession(sessionId) → SessionState
processUtterance(sessionId, text, ...) → AgentResponse
endSession(sessionId) → SessionState
getGreeting(lead, playbook, tone) → string
```

### `types.ts` - Type Definitions

```typescript
interface SessionState {
  sessionId: string;
  leadId: string;
  useCase: UseCase;
  agentState: AgentState;  // GREETING, PITCH, QUALIFY, etc.
  transcript: TranscriptEntry[];
  askedCount: number;      // Max 3 qualification questions
  selectedSlot?: SlotDisplay;
  proposedSlots?: SlotDisplay[];
  qualification?: { role, teamSize, challenge };
}
```

## Conversation States

```
GREETING ──► PITCH ──► QUALIFY ──► MEETING_PROPOSAL ──► BOOKING ──► ENDED
                          │              │
                          └──────────────┘  (objection handling)
```

## Tone Levels

| Range | Style | Greeting Example |
|-------|-------|------------------|
| 0-30 | Formal | "שלום [שם], כאן אלכס מחברת קול..." |
| 30-70 | Balanced | "היי [שם], זה אלכס מקול..." |
| 70-100 | Friendly | "היי [שם]! מה קורה? זה אלכס מקול..." |

## Extending

To modify AI behavior, edit `buildSystemPrompt()` in `aiDecider.ts`.

Key sections:
1. Persona & tone description
2. Value proposition
3. Challenge → Solution mapping
4. Scheduling rules
5. Output format

