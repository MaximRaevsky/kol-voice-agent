# Kol Server

Express.js backend for the AI calling agent.

## Structure

```
src/
├── index.ts                    # Server bootstrap
├── config/
│   └── env.ts                  # Zod-validated config
├── db/                         # JSON persistence layer
│   ├── jsonStore.ts            # Read/write to db/*.json
│   ├── leadRepo.ts             # Lead CRUD
│   ├── slotRepo.ts             # Calendar booking
│   ├── activityRepo.ts         # CRM activities
│   ├── playbookRepo.ts         # Conversation playbooks
│   └── seed.ts                 # Demo data generator
├── domain/
│   └── agent/
│       ├── aiDecider.ts        # 🧠 GPT-4o prompt & decision
│       ├── agentService.ts     # Session management
│       └── types.ts            # SessionState, etc.
├── providers/
│   ├── llm/openaiProvider.ts   # OpenAI wrapper
│   └── speech/azureTtsProvider.ts  # Azure TTS
└── routes/
    ├── api.ts                  # /api/* endpoints
    ├── call.ts                 # /api/call/* endpoints
    └── speech.ts               # /api/speech/tts
```

## Key Files

| File | Purpose |
|------|---------|
| `aiDecider.ts` | The "brain" - GPT-4o prompt that decides everything |
| `agentService.ts` | Session state, booking, CRM logging |
| `seed.ts` | Creates 7 leads, 98 slots, sample activities |

## API Endpoints

### Call Management
- `POST /api/call/start` - Start call session
- `POST /api/call/utterance` - Send customer message, get AI response
- `POST /api/call/end` - End call

### Data
- `GET /api/leads` - List all leads
- `GET /api/slots` - Calendar slots (all)
- `GET /api/metrics` - Call statistics
- `GET /api/playbook` - Conversation playbook

### Features
- `GET /health` - Status + feature flags
- `POST /api/speech/tts` - Azure TTS (if enabled)

## Environment

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional (HD voice)
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=westeurope
```

## Running

```bash
# From project root
npm run seed      # Create demo data
npm run dev       # Start server on :3001
```

