import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchAzureTts } from '../services/apiClient';

// ============================================
// Types
// ============================================

interface WebSpeechState {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: string;
}

interface UseWebSpeechOptions {
  useAzureTts?: boolean;
}

interface UseWebSpeechReturn extends WebSpeechState {
  startListening: () => Promise<string>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  cancelSpeech: () => void;
}

// ============================================
// Browser API Types
// ============================================

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

type SpeechRecognitionType = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

// ============================================
// Azure TTS Audio Player (with cancellation support)
// ============================================

// Global audio ref for cancellation
let currentAudio: HTMLAudioElement | null = null;

async function playAzureTts(text: string): Promise<void> {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  const blob = await fetchAzureTts(text);
  const url = URL.createObjectURL(blob);
  
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    currentAudio = audio;
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      resolve();
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      reject(new Error('Azure TTS playback failed'));
    };
    
    audio.play().catch((err) => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      reject(err);
    });
  });
}

function cancelAzureTts() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

// ============================================
// Browser TTS
// ============================================

function playBrowserTts(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'he-IL';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a Hebrew voice
    const voices = window.speechSynthesis.getVoices();
    const hebrewVoice = voices.find((v) => 
      v.lang.startsWith('he') || v.lang.includes('Hebrew')
    );
    
    if (hebrewVoice) {
      utterance.voice = hebrewVoice;
    }

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}

// ============================================
// Hook Implementation
// ============================================

export function useWebSpeech(options: UseWebSpeechOptions = {}): UseWebSpeechReturn {
  const { useAzureTts = false } = options;
  
  const [state, setState] = useState<WebSpeechState>({
    isListening: false,
    isSpeaking: false,
    isSupported: false,
    error: null,
    transcript: '',
  });

  const recognitionRef = useRef<InstanceType<SpeechRecognitionType> | null>(null);
  const resolveRef = useRef<((value: string) => void) | null>(null);
  const rejectRef = useRef<((reason: Error) => void) | null>(null);
  const transcriptRef = useRef<string>('');
  
  // Use ref to always have latest Azure TTS setting
  const useAzureTtsRef = useRef(useAzureTts);
  useAzureTtsRef.current = useAzureTts;

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = 
      (window as unknown as { SpeechRecognition?: SpeechRecognitionType }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition;

    const speechSynthesisSupported = 'speechSynthesis' in window;

    setState((prev) => ({
      ...prev,
      isSupported: !!SpeechRecognition && speechSynthesisSupported,
    }));
  }, []);

  // Start listening for speech
  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = 
        (window as unknown as { SpeechRecognition?: SpeechRecognitionType }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        const error = new Error('Speech recognition not supported');
        setState((prev) => ({ ...prev, error: error.message }));
        reject(error);
        return;
      }

      // Store resolve/reject for later
      resolveRef.current = resolve;
      rejectRef.current = reject;
      transcriptRef.current = '';

      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.lang = 'he-IL';
      recognition.continuous = true;  // Keep listening until user stops
      recognition.interimResults = true;

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setState((prev) => ({
          ...prev,
          isListening: true,
          error: null,
          transcript: '',
        }));
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        transcriptRef.current = transcript;
        setState((prev) => ({ ...prev, transcript }));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        const errorMessage = event.error === 'not-allowed'
          ? 'Microphone permission denied'
          : `Speech recognition error: ${event.error}`;

        setState((prev) => ({
          ...prev,
          isListening: false,
          error: errorMessage,
        }));

        if (rejectRef.current) {
          rejectRef.current(new Error(errorMessage));
          rejectRef.current = null;
          resolveRef.current = null;
        }
      };

      recognition.onend = () => {
        setState((prev) => ({ ...prev, isListening: false }));

        // Resolve with final transcript
        if (resolveRef.current) {
          resolveRef.current(transcriptRef.current);
          resolveRef.current = null;
          rejectRef.current = null;
        }
      };

      try {
        recognition.start();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start recognition';
        setState((prev) => ({ ...prev, error: errorMessage }));
        reject(new Error(errorMessage));
      }
    });
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Speak text using TTS (Azure or Browser)
  const speak = useCallback(async (text: string): Promise<void> => {
    setState((prev) => ({ ...prev, isSpeaking: true }));
    
    const shouldUseAzure = useAzureTtsRef.current;
    
    try {
      if (shouldUseAzure) {
        try {
          await playAzureTts(text);
          setState((prev) => ({ ...prev, isSpeaking: false }));
          return;
        } catch {
          // Fall through to browser TTS
        }
      }
      
      await playBrowserTts(text);
      setState((prev) => ({ ...prev, isSpeaking: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, isSpeaking: false }));
      throw error;
    }
  }, []);

  // Cancel speech
  const cancelSpeech = useCallback(() => {
    // Cancel browser TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Cancel Azure TTS
    cancelAzureTts();
    
    setState((prev) => ({ ...prev, isSpeaking: false }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    cancelSpeech,
  };
}

export default useWebSpeech;
