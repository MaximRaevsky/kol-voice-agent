import { useEffect, useRef } from 'react';
import type { Lead, AgentState } from '@kol/shared';
import type { TranscriptMessage, CallState } from '../hooks/useCallSession';

interface TranscriptProps {
  messages: TranscriptMessage[];
  callState: CallState;
  agentState: AgentState;
  selectedLead: Lead | null;
}

const STATE_LABELS: Record<AgentState, string> = {
  GREETING: 'Opening',
  PITCH: 'Pitching',
  QUALIFY: 'Qualifying',
  MEETING_PROPOSAL: 'Proposing Meeting',
  BOOKING: 'Booking',
  CLOSING: 'Closing',
  ENDED: 'Call Ended',
};

export function Transcript({ messages, callState, agentState, selectedLead }: TranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card transcript-card" data-hook="transcript">
      <div className="card-header">
        <h3 className="card-title">Transcript</h3>
        {callState === 'connected' && (
          <span className="badge badge-info">{STATE_LABELS[agentState]}</span>
        )}
      </div>

      <div className="transcript-container" ref={containerRef}>
        {callState === 'idle' && !selectedLead && (
          <div className="transcript-empty">
            <div className="transcript-empty-icon"></div>
            <p>Select a lead to start a call</p>
          </div>
        )}

        {callState === 'idle' && selectedLead && (
          <div className="transcript-empty">
            <p>Ready to call <strong dir="rtl">{selectedLead.name}</strong></p>
          </div>
        )}

        {callState === 'dialing' && (
          <div className="transcript-status">
            <div className="dialing-animation">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Calling {selectedLead?.name}...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`transcript-message transcript-message--${message.role}`}
            data-hook={`transcript-message-${message.role}`}
          >
            <div className="transcript-message-header">
              <span className="transcript-message-role">
                {message.role === 'agent' ? '🤖 Alex' : '👤 Customer'}
              </span>
              <span className="transcript-message-time">{formatTime(message.timestamp)}</span>
            </div>
            <div className="transcript-message-text" dir="rtl">
              {message.text}
            </div>
          </div>
        ))}

        {callState === 'ended' && messages.length > 0 && (
          <div className="transcript-status transcript-status--ended">
            <p>✅ Call ended</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transcript;
