import { useState, useEffect } from 'react';
import { getMetrics, type MetricsResponse } from '../services/apiClient';

const OUTCOME_LABELS: Record<string, string> = {
  MEETING_BOOKED: 'Meeting Booked',
  CALLBACK_REQUESTED: 'Callback Requested',
  NOT_INTERESTED: 'Not Interested',
  NO_ANSWER: 'No Answer',
  WRONG_NUMBER: 'Wrong Number',
  OTHER: 'Other',
};

const OUTCOME_COLORS: Record<string, string> = {
  MEETING_BOOKED: '#22c55e',
  CALLBACK_REQUESTED: '#f59e0b',
  NOT_INTERESTED: '#ef4444',
  NO_ANSWER: '#94a3b8',
  WRONG_NUMBER: '#64748b',
  OTHER: '#6366f1',
};

export function Metrics() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch {
      // Failed to load metrics
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page metrics-page">
        <div className="page-header">
          <h1 className="page-title">Track & Optimize</h1>
        </div>
        <div className="loading-state">Loading metrics...</div>
      </div>
    );
  }

  const maxOutcome = Math.max(...Object.values(metrics?.byOutcome || { a: 1 }), 1);
  const totalOutcomes = Object.values(metrics?.byOutcome || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="page metrics-page">
      <div className="page-header">
        <h1 className="page-title">Track & Optimize</h1>
        <p className="page-subtitle">Monitor Alex's performance</p>
      </div>

      {/* Stats Cards - 2x2 Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-text">C</div>
          <div className="stat-content">
            <div className="stat-value">{metrics?.totals.totalCalls || 0}</div>
            <div className="stat-label">Total Calls</div>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon-text">M</div>
          <div className="stat-content">
            <div className="stat-value">{metrics?.totals.meetingsBooked || 0}</div>
            <div className="stat-label">Meetings</div>
          </div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-icon-text">%</div>
          <div className="stat-content">
            <div className="stat-value">
              {((metrics?.totals.conversionRate || 0) * 100).toFixed(0)}%
            </div>
            <div className="stat-label">Conversion</div>
          </div>
        </div>
        
        <div className="stat-card neutral">
          <div className="stat-icon-text">T</div>
          <div className="stat-content">
            <div className="stat-value">{metrics?.totals.avgDuration || 0}s</div>
            <div className="stat-label">Avg Duration</div>
          </div>
        </div>
      </div>

      {/* Outcomes Breakdown */}
      <div className="outcomes-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Outcomes Breakdown</h3>
            <span className="total-badge">{totalOutcomes} total</span>
          </div>
          <div className="outcomes-list">
            {Object.entries(metrics?.byOutcome || {})
              .sort(([, a], [, b]) => b - a)
              .map(([outcome, count]) => (
              <div key={outcome} className="outcome-row">
                <div className="outcome-info">
                  <span 
                    className="outcome-dot" 
                    style={{ backgroundColor: OUTCOME_COLORS[outcome] || '#6366f1' }}
                  />
                  <span className="outcome-name">{OUTCOME_LABELS[outcome] || outcome}</span>
                </div>
                <div className="outcome-bar-wrapper">
                  <div 
                    className="outcome-bar-fill"
                    style={{ 
                      width: `${(count / maxOutcome) * 100}%`,
                      backgroundColor: OUTCOME_COLORS[outcome] || '#6366f1'
                    }}
                  />
                </div>
                <span className="outcome-value">{count}</span>
              </div>
            ))}
            {Object.keys(metrics?.byOutcome || {}).length === 0 && (
              <div className="empty-state">
                <p>No calls recorded yet</p>
                <p className="hint">Start making calls to see metrics here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
