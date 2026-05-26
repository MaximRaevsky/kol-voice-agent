import type { Lead } from '@kol/shared';

interface LeadCardProps {
  lead: Lead;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const STATUS_LABELS: Record<Lead['status'], { label: string; className: string }> = {
  NEW: { label: 'NEW', className: 'badge-new' },
  CONTACTED: { label: 'CONTACTED', className: 'badge-contacted' },
  QUALIFIED: { label: 'QUALIFIED', className: 'badge-qualified' },
  MEETING_SCHEDULED: { label: 'MEETING', className: 'badge-meeting' },
  NOT_INTERESTED: { label: 'NOT INTERESTED', className: 'badge-not-interested' },
  DO_NOT_CALL: { label: 'DNC', className: 'badge-dnc' },
};

export function LeadCard({ lead, selected, disabled, onClick }: LeadCardProps) {
  const statusInfo = STATUS_LABELS[lead.status];

  return (
    <div
      className={`lead-card ${selected ? 'lead-card--selected' : ''} ${disabled ? 'lead-card--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      data-hook="lead-card"
      data-lead-id={lead.id}
    >
      <div className="lead-card-header">
        <span className={`lead-status-badge ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
        <span className="lead-card-name" dir="rtl">{lead.name}</span>
      </div>

      {lead.company && (
        <div className="lead-card-company" dir="rtl">
          {lead.company}
        </div>
      )}

      <div className="lead-card-phone">
        {lead.phone}
      </div>
    </div>
  );
}

export default LeadCard;
