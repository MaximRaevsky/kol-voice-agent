# @kol/shared

Shared TypeScript types and Zod schemas used by both server and web apps.

## Structure

```
src/
├── index.ts                    # Main exports
├── domain/                     # Business domain types
│   ├── lead.ts                 # Lead, LeadStatus
│   ├── calendarSlot.ts         # CalendarSlot, SlotDisplay
│   ├── crmActivity.ts          # CrmActivity, ActivityType
│   ├── playbook.ts             # Playbook + DEFAULT_PLAYBOOK_HE
│   ├── callOutcome.ts          # CallOutcome enum
│   └── useCase.ts              # UseCase enum
└── wire/                       # API message types
    ├── clientMessages.ts       # Client → Server
    └── serverMessages.ts       # Server → Client
```

## Key Types

### Lead

```typescript
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 
                  'MEETING_SCHEDULED' | 'NOT_INTERESTED' | 'DO_NOT_CALL';

interface Lead {
  id: string;
  name: string;
  phone: string;
  company?: string;
  title?: string;
  email?: string;
  status: LeadStatus;
  notes?: string;
  lastContactAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

### CalendarSlot

```typescript
type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';

interface CalendarSlot {
  id: string;
  startTime: number;  // Unix timestamp ms
  endTime: number;
  status: SlotStatus;
  leadId?: string;    // If booked
  activityId?: string;
}

interface SlotDisplay {
  id: string;
  displayText: string;  // "יום שני, 10:00"
  dayOfWeek: string;
  time: string;
  date: string;
}
```

### CallOutcome

```typescript
type CallOutcome = 'MEETING_BOOKED' | 'NOT_INTERESTED' | 
                   'CALLBACK_REQUESTED' | 'WRONG_NUMBER' | 'OTHER';
```

### AgentState

```typescript
type AgentState = 'GREETING' | 'PITCH' | 'QUALIFY' | 
                  'MEETING_PROPOSAL' | 'BOOKING' | 'CLOSING' | 'ENDED';
```

## Usage

```typescript
import { Lead, LeadSchema, CalendarSlot, CallOutcome } from '@kol/shared';

// Validate with Zod
const lead = LeadSchema.parse(data);

// Type check
const outcome: CallOutcome = 'MEETING_BOOKED';
```

## Playbook

Default Hebrew playbook is exported:

```typescript
import { DEFAULT_PLAYBOOK_HE } from '@kol/shared';

// Contains:
// - useCase: OUTBOUND_SALES_HE
// - name: playbook display name
// - language: he-IL
// - companyName: company name for the agent
// - productDescription: Hebrew product description
```

