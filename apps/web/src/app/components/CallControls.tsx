import type { Lead } from '@kol/shared';
import type { CallState } from '../hooks/useCallSession';

interface CallControlsProps {
  callState: CallState;
  selectedLead: Lead | null;
  isRecording: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function CallControls({
  callState,
  selectedLead,
  isRecording,
  onStartCall,
  onEndCall,
  onStartRecording,
  onStopRecording,
}: CallControlsProps) {
  const isCallActive = callState === 'connected';
  const canStartCall = callState === 'idle' && selectedLead !== null;

  return (
    <div className="call-controls" data-hook="call-controls">
      {/* Status indicator */}
      <div className="call-controls-status">
        <div className={`status-dot status-dot--${callState}`} />
        <span>
          {callState === 'idle' && 'Ready'}
          {callState === 'dialing' && 'Dialing...'}
          {callState === 'connected' && 'Connected'}
          {callState === 'ended' && 'Call Ended'}
        </span>
      </div>

      {/* Start call button */}
      {callState === 'idle' && (
        <button
          className="btn btn-primary btn-large"
          onClick={onStartCall}
          disabled={!canStartCall}
          data-hook="start-call-btn"
        >
          Start Call
        </button>
      )}

      {/* Voice control - Click to talk */}
      {isCallActive && (
        <div className="voice-controls">
          <button
            className={`hold-to-talk ${isRecording ? 'hold-to-talk--active' : ''}`}
            data-hook="talk-btn"
            onClick={isRecording ? onStopRecording : onStartRecording}
          >
            <span className="hold-to-talk-icon">{isRecording ? '⏹️' : '🎤'}</span>
            <span className="hold-to-talk-text">
              {isRecording ? 'Stop' : 'Talk'}
            </span>
          </button>

          {isRecording && (
            <div className="listening-indicator">
              <div className="listening-wave" />
              <div className="listening-wave" />
              <div className="listening-wave" />
            </div>
          )}
        </div>
      )}

      {/* End call button */}
      {(callState === 'dialing' || callState === 'connected') && (
        <button
          className="btn btn-danger"
          onClick={onEndCall}
          data-hook="end-call-btn"
        >
          End Call
        </button>
      )}
    </div>
  );
}

export default CallControls;
