# Kol Web

React + Vite frontend for the AI calling agent.

## Structure

```
src/app/
├── App.tsx                 # Router setup
├── routes/
│   ├── Home.tsx            # Lead selection + tone slider
│   ├── CallConsole.tsx     # Main call interface
│   └── Metrics.tsx         # Call performance stats
├── components/
│   ├── LeadCard.tsx        # Lead display with RTL Hebrew
│   ├── Transcript.tsx      # Scrollable chat history
│   ├── CallControls.tsx    # Start/End, Talk button
│   └── CrmPanel.tsx        # Activity sidebar
├── hooks/
│   ├── useWebSpeech.ts     # Browser STT + Azure TTS
│   ├── useCallSession.ts   # Call state machine
│   └── useLeads.ts         # Lead list fetching
└── services/
    ├── apiClient.ts        # REST API wrapper
    └── audio.ts            # Ring tones, beeps
```

## Key Features

### Speech Recognition (STT)
- Uses browser's `SpeechRecognition` API
- Language: `he-IL` (Hebrew)
- Continuous mode for natural conversation

### Text-to-Speech (TTS)
1. **Azure TTS** (if configured) - High quality Hebrew voice
2. **Browser TTS** (fallback) - Uses `SpeechSynthesis`

### Call Flow
```
Home → Select lead → Set tone → Start Call
                          ↓
CallConsole → Ring → Connected → Talk → Listen → Repeat
                          ↓
                       End Call → Metrics updated
```

### UI Elements
- **Tone Slider**: 0 (formal) ↔ 100 (friendly)
- **Lead List**: Click to select, Hebrew names RTL
- **Calendar**: Date picker with time slots
- **Transcript**: Auto-scrolling chat

## Running

```bash
# From project root
npm run dev       # Starts on :5173
```

Open Chrome (required for speech recognition).

## Browser Requirements

- Chrome/Edge (WebKit speech recognition)
- Microphone permission
- HTTPS or localhost (for mic access)

