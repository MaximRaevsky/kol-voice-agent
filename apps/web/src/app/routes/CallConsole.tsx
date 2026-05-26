import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { Lead, CalendarSlot } from '@kol/shared';
import { LeadCard } from '../components/LeadCard';
import { Transcript } from '../components/Transcript';
import { CallControls } from '../components/CallControls';
import { CrmPanel } from '../components/CrmPanel';
import { useCallSession } from '../hooks/useCallSession';
import { useLeads } from '../hooks/useLeads';
import { getFeatures } from '../services/apiClient';

export function CallConsole() {
  const location = useLocation();
  const { leads, loading: leadsLoading, refresh: refreshLeads } = useLeads();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const autoStartedRef = useRef(false);

  // Extract state from navigation
  const navState = location.state as { leadId?: string; tone?: number; autoStart?: boolean } | null;
  const [tone, setTone] = useState(navState?.tone ?? 50);
  
  // Azure TTS state
  const [azureTtsAvailable, setAzureTtsAvailable] = useState(false);
  const [useAzureTts, setUseAzureTts] = useState(false);

  // Check feature flags on mount
  useEffect(() => {
    getFeatures()
      .then((features) => {
        setAzureTtsAvailable(features.azureTtsEnabled);
        setUseAzureTts(features.azureTtsEnabled);
      })
      .catch(() => {
        // Use default browser TTS
      });
  }, []);
  

  // Load slots function
  const loadSlots = useCallback(async () => {
    try {
      const response = await fetch('/api/slots');
      const data = await response.json();
      setSlots(data.slots || []);
    } catch {
      // Failed to load slots
    }
  }, []);

  const {
    callState,
    agentState,
    transcript,
    activities,
    isRecording,
    startCall,
    endCall,
    resetCall,
    startRecording,
    stopRecording,
  } = useCallSession({
    onCallEnded: () => {
      refreshLeads();
      loadSlots();
    },
    tone,
    useAzureTts,
  });

  // Auto-select lead from navigation state
  useEffect(() => {
    if (navState?.leadId && leads.length > 0) {
      const lead = leads.find(l => l.id === navState.leadId);
      if (lead) setSelectedLead(lead);
    }
  }, [navState?.leadId, leads]);

  // Auto-start call if requested
  useEffect(() => {
    if (
      navState?.autoStart && 
      selectedLead && 
      callState === 'idle' && 
      !autoStartedRef.current
    ) {
      autoStartedRef.current = true;
      setTimeout(() => {
        startCall(selectedLead.id);
      }, 500);
    }
  }, [navState?.autoStart, selectedLead, callState, startCall]);

  // Load slots on mount
  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleSelectLead = useCallback((lead: Lead) => {
    if (callState === 'idle' || callState === 'ended') {
      // Reset call state if previous call ended
      if (callState === 'ended') {
        resetCall();
      }
      setSelectedLead(lead);
    }
  }, [callState, resetCall]);

  const handleStartCall = useCallback(async () => {
    if (selectedLead) {
      await startCall(selectedLead.id);
    }
  }, [selectedLead, startCall]);

  const handleEndCall = useCallback(async () => {
    await endCall();
  }, [endCall]);

  // Calendar: group slots by date
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Get unique dates from slots
  const slotsByDate = slots.reduce((acc, slot) => {
    const dateKey = new Date(slot.startTime).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);
  
  const uniqueDates = Object.keys(slotsByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
  // Auto-select first date if none selected
  useEffect(() => {
    if (!selectedDate && uniqueDates.length > 0) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);
  
  // Get slots for selected date
  const slotsForSelectedDate = selectedDate ? (slotsByDate[selectedDate] || []).sort(
    (a, b) => a.startTime - b.startTime
  ) : [];
  
  // Stats
  const bookedCount = slots.filter(s => s.status === 'BOOKED').length;
  const availableCount = slots.filter(s => s.status === 'AVAILABLE').length;

  // Get tone label
  const getToneLabel = () => {
    if (tone < 30) return 'Formal';
    if (tone < 70) return 'Balanced';
    return 'Friendly';
  };

  // Format slot time for display (with numeric month)
  const formatSlotTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const dayName = date.toLocaleDateString('he-IL', { weekday: 'short' });
    const dayNum = date.getDate();
    const month = date.getMonth() + 1; // 1-12
    const time = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return { dayName, dayNum, month, time };
  };

  return (
    <div className="page console-page">
      {/* Compact Header with Tone Control */}
      <div className="console-header">
        <div className="console-title">
          <h1>Call Console</h1>
        </div>
        
        <div className="console-controls">
          {/* Tone Control */}
          <div className="console-tone-control">
            <span className="tone-label">Tone: {getToneLabel()}</span>
            <div className="tone-slider-compact">
              <span className="tone-text">Formal</span>
              <input
                type="range"
                min="0"
                max="100"
                value={tone}
                onChange={(e) => setTone(Number(e.target.value))}
                className="slider-input-sm"
                disabled={callState === 'connected' || callState === 'dialing'}
              />
              <span className="tone-text">Friendly</span>
            </div>
          </div>
        </div>
      </div>

      <div className="call-console" data-hook="call-console">
        {/* Lead list sidebar */}
        <div className="call-console-sidebar">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Leads</h3>
              <span className="badge badge-info">{leads.length}</span>
            </div>
            <div className="lead-list" data-hook="lead-list">
              {leadsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Loading...
                </div>
              ) : (
                leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    selected={selectedLead?.id === lead.id}
                    onClick={() => handleSelectLead(lead)}
                    disabled={callState === 'connected' || callState === 'dialing'}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main call area */}
        <div className="call-console-main">
          <Transcript
            messages={transcript}
            callState={callState}
            agentState={agentState}
            selectedLead={selectedLead}
          />

          <CallControls
            callState={callState}
            selectedLead={selectedLead}
            isRecording={isRecording}
            onStartCall={handleStartCall}
            onEndCall={handleEndCall}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
          />
        </div>

        {/* Tools Panel - CRM + Calendar */}
        <div className="call-console-right">
          {/* CRM Panel */}
          <div className="tools-section">
            <div className="tools-header">
              <span className="tools-icon-text">CRM</span>
            </div>
            <CrmPanel
              lead={selectedLead}
              callState={callState}
              agentState={agentState}
              activities={activities}
            />
          </div>

          {/* Calendar Panel */}
          <div className="tools-section calendar-section">
            <div className="tools-header">
              <span className="tools-icon-text">Calendar</span>
              <span className="calendar-stats">
                <span className="stat-booked">{bookedCount} booked</span>
                <span className="stat-separator">•</span>
                <span className="stat-available">{availableCount} available</span>
              </span>
            </div>
            
            {/* Date Picker Calendar */}
            <div className="calendar-picker">
              {/* Date Tabs */}
              <div className="date-tabs">
                {uniqueDates.slice(0, 7).map((dateStr) => {
                  const date = new Date(dateStr);
                  const dayName = date.toLocaleDateString('he-IL', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const month = date.getMonth() + 1;
                  const isSelected = selectedDate === dateStr;
                  const daySlots = slotsByDate[dateStr] || [];
                  const hasBooked = daySlots.some(s => s.status === 'BOOKED');
                  const availableCount = daySlots.filter(s => s.status === 'AVAILABLE').length;
                  
                  return (
                    <button
                      key={dateStr}
                      className={`date-tab ${isSelected ? 'selected' : ''} ${hasBooked ? 'has-booked' : ''}`}
                      onClick={() => setSelectedDate(dateStr)}
                    >
                      <span className="date-tab-day">{dayName}</span>
                      <span className="date-tab-num">{dayNum}/{month}</span>
                      {availableCount > 0 && (
                        <span className="date-tab-count">{availableCount}</span>
                      )}
                      {hasBooked && <span className="date-tab-booked-dot"></span>}
                    </button>
                  );
                })}
              </div>
              
              {/* Time Slots for Selected Date */}
              <div className="time-slots">
                {slotsForSelectedDate.length === 0 ? (
                  <div className="empty-slots">No slots for this date</div>
                ) : (
                  <div className="time-slots-grid">
                    {slotsForSelectedDate.map((slot) => {
                      const time = new Date(slot.startTime).toLocaleTimeString('he-IL', { 
                        hour: '2-digit', minute: '2-digit' 
                      });
                      const isBooked = slot.status === 'BOOKED';
                      const lead = isBooked ? leads.find(l => l.id === slot.leadId) : null;
                      
                      return (
                        <div 
                          key={slot.id} 
                          className={`time-slot ${isBooked ? 'booked' : 'available'}`}
                        >
                          <span className="time-slot-time">{time}</span>
                          {isBooked ? (
                            <span className="time-slot-lead" dir="rtl">{lead?.name || 'Booked'}</span>
                          ) : (
                            <span className="time-slot-status">Available</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
