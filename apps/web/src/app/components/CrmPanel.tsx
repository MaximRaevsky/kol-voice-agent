import type { Lead, CrmActivity, AgentState } from '@kol/shared';
import type { CallState } from '../hooks/useCallSession';

interface CrmPanelProps {
  lead: Lead | null;
  callState: CallState;
  agentState: AgentState;
  activities: CrmActivity[];
}

const OUTCOME_LABELS: Record<string, { label: string; className: string }> = {
  MEETING_BOOKED: { label: 'Meeting Booked', className: 'outcome-meeting' },
  CALLBACK_REQUESTED: { label: 'Callback Requested', className: 'outcome-callback' },
  NOT_INTERESTED: { label: 'Not Interested', className: 'outcome-not-interested' },
  NO_ANSWER: { label: 'No Answer', className: 'outcome-no-answer' },
  WRONG_NUMBER: { label: 'Wrong Number', className: 'outcome-wrong' },
  DO_NOT_CALL: { label: 'Do Not Call', className: 'outcome-dnc' },
  VOICEMAIL: { label: 'Voicemail', className: 'outcome-voicemail' },
  BUSY: { label: 'Busy', className: 'outcome-busy' },
  OTHER: { label: 'Other', className: 'outcome-other' },
};

const STATUS_LABELS: Record<Lead['status'], { label: string; className: string }> = {
  NEW: { label: 'New', className: 'status-new' },
  CONTACTED: { label: 'Contacted', className: 'status-contacted' },
  QUALIFIED: { label: 'Qualified', className: 'status-qualified' },
  MEETING_SCHEDULED: { label: 'Meeting Scheduled', className: 'status-meeting' },
  NOT_INTERESTED: { label: 'Not Interested', className: 'status-not-interested' },
  DO_NOT_CALL: { label: 'Do Not Call', className: 'status-dnc' },
};

export function CrmPanel({ lead, callState, activities }: CrmPanelProps) {
  const latestActivity = activities[activities.length - 1];
  const outcomeInfo = latestActivity ? OUTCOME_LABELS[latestActivity.outcome] : null;

  return (
    <div className="card crm-panel" data-hook="crm-panel">
      <div className="card-header">
        <h3 className="card-title">CRM Activity</h3>
      </div>

      {!lead && (
        <div className="crm-panel-empty">
          <p>Select a lead to view details</p>
        </div>
      )}

      {lead && (
        <>
          <div className="crm-section">
            <h4 className="crm-section-title">Lead Info</h4>
            <div className="crm-field">
              <span className="crm-field-label">Name:</span>
              <span className="crm-field-value" dir="rtl">{lead.name}</span>
            </div>
            {lead.company && (
              <div className="crm-field">
                <span className="crm-field-label">Company:</span>
                <span className="crm-field-value" dir="rtl">{lead.company}</span>
              </div>
            )}
            {lead.title && (
              <div className="crm-field">
                <span className="crm-field-label">Title:</span>
                <span className="crm-field-value" dir="rtl">{lead.title}</span>
              </div>
            )}
            <div className="crm-field">
              <span className="crm-field-label">Phone:</span>
              <span className="crm-field-value">{lead.phone}</span>
            </div>
            <div className="crm-field">
              <span className="crm-field-label">Status:</span>
              <span className={`crm-status-badge ${STATUS_LABELS[lead.status].className}`}>
                {STATUS_LABELS[lead.status].label}
              </span>
            </div>
          </div>

          {outcomeInfo && callState === 'ended' && (
            <div className="crm-section crm-outcome">
              <h4 className="crm-section-title">Call Outcome</h4>
              <div className={`crm-outcome-badge ${outcomeInfo.className}`}>
                <span className="crm-outcome-label">{outcomeInfo.label}</span>
              </div>
            </div>
          )}

          {latestActivity && (
            <div className="crm-section">
              <h4 className="crm-section-title">Latest Activity</h4>
              <div className="crm-field">
                <span className="crm-field-label">Summary:</span>
                <span className="crm-field-value" dir="rtl">{latestActivity.summary}</span>
              </div>
              {latestActivity.notes && (
                <div className="crm-field">
                  <span className="crm-field-label">Notes:</span>
                  <span className="crm-field-value" dir="rtl">{latestActivity.notes}</span>
                </div>
              )}
              <div className="crm-field">
                <span className="crm-field-label">Duration:</span>
                <span className="crm-field-value">{latestActivity.duration}s</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CrmPanel;
