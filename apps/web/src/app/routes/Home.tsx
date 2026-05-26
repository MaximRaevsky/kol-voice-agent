import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lead } from '@kol/shared';
import { getLeads } from '../services/apiClient';

export function Home() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [tone, setTone] = useState(50); // 0=Formal, 100=Friendly
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch {
      // Failed to load leads
    } finally {
      setLoading(false);
    }
  }

  const handleStartCall = () => {
    if (selectedLead) {
      // Navigate to console and auto-start the call
      navigate('/console', { 
        state: { 
          leadId: selectedLead.id, 
          tone,
          autoStart: true 
        } 
      });
    }
  };

  // Get tone label
  const getToneLabel = () => {
    if (tone < 30) return 'Formal';
    if (tone < 70) return 'Balanced';
    return 'Friendly';
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="alex-avatar-large">
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="95" fill="#c4b5fd"/>
            <circle cx="100" cy="85" r="40" fill="#d4a574"/>
            <circle cx="88" cy="80" r="6" fill="#333"/>
            <circle cx="112" cy="80" r="6" fill="#333"/>
            <path d="M88 95 Q100 108 112 95" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <ellipse cx="100" cy="55" rx="35" ry="25" fill="#6b4423"/>
            <rect x="60" y="75" width="8" height="20" rx="4" fill="#333"/>
            <rect x="132" y="75" width="8" height="20" rx="4" fill="#333"/>
            <path d="M56 90 Q56 85 64 85" stroke="#333" strokeWidth="2" fill="none"/>
            <path d="M144 90 Q144 85 136 85" stroke="#333" strokeWidth="2" fill="none"/>
            <rect x="80" y="130" width="40" height="50" rx="5" fill="white"/>
          </svg>
        </div>
        <h1 className="hero-title">Meet Alex</h1>
        <p className="hero-subtitle">Your AI agent is ready to call</p>
      </div>

      {/* Configuration Card */}
      <div className="config-card">
        {/* Lead Selection - Main Focus */}
        <div className="config-section">
          <label className="config-label">Select Lead to Call</label>
          {loading ? (
            <p className="loading-text">Loading leads...</p>
          ) : (
            <div className="lead-grid-compact">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  className={`lead-card-mini ${selectedLead?.id === lead.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                >
                  <span className="lead-name-he" dir="rtl">{lead.name}</span>
                  <span className="lead-company-he" dir="rtl">{lead.company}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings Row */}
        <div className="settings-row">
          {/* Use Case */}
          <div className="setting-item">
            <label className="setting-label">Use Case</label>
            <div className="setting-value">
              <span className="flag-emoji">🇮🇱</span>
              Outbound Sales (Hebrew)
            </div>
          </div>

          {/* Tone */}
          <div className="setting-item tone-setting">
            <label className="setting-label">Tone: {getToneLabel()}</label>
            <div className="tone-slider-mini">
              <span className="tone-text-mini">Formal</span>
              <input
                type="range"
                min="0"
                max="100"
                value={tone}
                onChange={(e) => setTone(Number(e.target.value))}
                className="slider-input"
              />
              <span className="tone-text-mini">Friendly</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          className="start-call-btn-large"
          onClick={handleStartCall}
          disabled={!selectedLead}
        >
          {selectedLead ? (
            <>
              <span className="call-text">Call</span>
              <span className="call-name" dir="rtl">{selectedLead.name}</span>
            </>
          ) : (
            <span className="call-text">Select a lead to call</span>
          )}
        </button>
      </div>
    </div>
  );
}
