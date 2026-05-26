import { useState, useCallback, useRef, useEffect } from 'react';
import type { Lead, CrmActivity, AgentState } from '@kol/shared';
import { startCall, sendUtterance, endCall as endCallApi } from '../services/apiClient';
import { useWebSpeech } from './useWebSpeech';
import { playRingTone, playConnectedBeep, playDisconnectBeep } from '../services/audio';

// ============================================
// Types
// ============================================

export type CallState = 'idle' | 'dialing' | 'connected' | 'ended';

export interface TranscriptMessage {
  id: string;
  role: 'agent' | 'customer' | 'system';
  text: string;
  timestamp: number;
}

interface UseCallSessionOptions {
  onCallEnded?: () => void;
  tone?: number; // 0=formal, 100=friendly
  useAzureTts?: boolean; // Use Azure TTS for better voice quality
}

interface UseCallSessionReturn {
  callState: CallState;
  agentState: AgentState;
  transcript: TranscriptMessage[];
  activities: CrmActivity[];
  isRecording: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  currentTranscript: string;
  sessionId: string | null;
  startCall: (leadId: string) => Promise<void>;
  endCall: () => Promise<void>;
  resetCall: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendTypedMessage: (text: string) => Promise<void>;
}

// ============================================
// Hook Implementation
// ============================================

export function useCallSession(options: UseCallSessionOptions = {}): UseCallSessionReturn {
  const { onCallEnded, tone = 50, useAzureTts = false } = options;

  const [callState, setCallState] = useState<CallState>('idle');
  const [agentState, setAgentState] = useState<AgentState>('ENDED');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);

  const {
    isListening: isRecording,
    isSpeaking,
    isSupported,
    transcript: currentTranscript,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  } = useWebSpeech({ useAzureTts });

  const ringToneRef = useRef<{ stop: () => void } | null>(null);
  const messageIdRef = useRef(0);

  // Cleanup ring tone and speech on unmount
  useEffect(() => {
    return () => {
      if (ringToneRef.current) {
        ringToneRef.current.stop();
      }
      // Stop any ongoing speech when leaving
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const addMessage = useCallback((role: TranscriptMessage['role'], text: string) => {
    const message: TranscriptMessage = {
      id: `msg-${++messageIdRef.current}`,
      role,
      text,
      timestamp: Date.now(),
    };
    setTranscript((prev) => [...prev, message]);
    return message;
  }, []);

  // Start a call
  const handleStartCall = useCallback(async (leadId: string) => {
    try {
      setCallState('dialing');
      setAgentState('GREETING');
      setTranscript([]);
      setActivities([]);
      setCurrentLeadId(leadId);

      // Play ring tone
      ringToneRef.current = playRingTone();

      // Simulate dialing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Stop ring tone
      if (ringToneRef.current) {
        ringToneRef.current.stop();
        ringToneRef.current = null;
      }

      // Start call via API (with tone setting)
      const response = await startCall(leadId, 'OUTBOUND_SALES_HE', tone);
      setSessionId(response.sessionId);

      // Play connected beep
      playConnectedBeep();
      setCallState('connected');

      // Process events
      let greeting = '';
      for (const event of response.events) {
        if (event.type === 'AGENT_RESPONSE') {
          greeting = event.text;
          setAgentState(event.state);
          addMessage('agent', event.text);
        }
      }

      // Speak the greeting
      if (greeting) {
        try {
          await speak(greeting);
        } catch {
          // TTS failed silently
        }
      }
    } catch {
      // Stop ring tone on error
      if (ringToneRef.current) {
        ringToneRef.current.stop();
        ringToneRef.current = null;
      }

      setCallState('idle');
      setAgentState('ENDED');
    }
  }, [speak, addMessage]);

  // Process an utterance
  const processUtterance = useCallback(async (text: string, source: 'voice' | 'typed') => {
    if (!sessionId || !text.trim()) return;

    try {
      addMessage('customer', text);

      const response = await sendUtterance(sessionId, text, source, tone);

      // Process events
      let agentText = '';
      for (const event of response.events) {
        if (event.type === 'AGENT_RESPONSE') {
          agentText = event.text;
          setAgentState(event.state);
          addMessage('agent', event.text);
        }
        if (event.type === 'CRM_UPDATED') {
          setActivities((prev) => [...prev, event.activity]);
        }
      }

      // Speak agent response FIRST (including the last message before ending!)
      if (agentText) {
        try {
          await speak(agentText);
        } catch {
          // TTS failed silently
        }
      }

      // Handle call end AFTER speaking the last message
      if (response.ended) {
        setCallState('ended');
        setAgentState('ENDED');
        playDisconnectBeep();
        onCallEnded?.();
      }
    } catch {
      // Failed to process utterance
    }
  }, [sessionId, speak, addMessage, onCallEnded, tone]);

  // Start recording
  const startRecording = useCallback(() => {
    if (callState !== 'connected') return;

    cancelSpeech();
    startListening()
      .then((transcript) => {
        if (transcript && transcript.trim()) {
          processUtterance(transcript, 'voice');
        }
      })
      .catch(() => {
        // Speech recognition failed
      });
  }, [callState, startListening, cancelSpeech, processUtterance]);

  // Stop recording
  const stopRecording = useCallback(() => {
    stopListening();
  }, [stopListening]);

  // Send typed message
  const sendTypedMessage = useCallback(async (text: string) => {
    if (text.trim()) {
      await processUtterance(text, 'typed');
    }
  }, [processUtterance]);

  // End the call
  const handleEndCall = useCallback(async () => {
    if (!sessionId) return;

    try {
      cancelSpeech();

      const response = await endCallApi(sessionId);

      setCallState('ended');
      setAgentState('ENDED');

      if (response.activity) {
        setActivities((prev) => [...prev, response.activity!]);
      }

      playDisconnectBeep();
      onCallEnded?.();
    } catch {
      setCallState('ended');
      setAgentState('ENDED');
    }
  }, [sessionId, cancelSpeech, onCallEnded]);

  // Reset call state (for selecting a new lead)
  const resetCall = useCallback(() => {
    cancelSpeech(); // Stop any ongoing speech
    setCallState('idle');
    setAgentState('ENDED');
    setTranscript([]);
    setActivities([]);
    setSessionId(null);
    setCurrentLeadId(null);
  }, [cancelSpeech]);

  return {
    callState,
    agentState,
    transcript,
    activities,
    isRecording,
    isSpeaking,
    isSupported,
    currentTranscript,
    sessionId,
    startCall: handleStartCall,
    endCall: handleEndCall,
    resetCall,
    startRecording,
    stopRecording,
    sendTypedMessage,
  };
}

export default useCallSession;
