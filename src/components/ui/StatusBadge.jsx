import React from 'react';

/** Maps booking/driver status values to visual style tokens */
const STATUS_MAP = {
  // Positive / complete
  active:           { dot: 'bg-success',        text: 'text-success',        bg: 'bg-success-dim'       },
  online:           { dot: 'bg-success',        text: 'text-success',        bg: 'bg-success-dim'       },
  available:        { dot: 'bg-success',        text: 'text-success',        bg: 'bg-success-dim'       },
  'trip complete':  { dot: 'bg-success',        text: 'text-success',        bg: 'bg-success-dim'       },
  approved:         { dot: 'bg-success',        text: 'text-success',        bg: 'bg-success-dim'       },
  confirmed:        { dot: 'bg-success',        text: 'text-success',        bg: 'bg-success-dim'       },

  // Neutral / pending
  pending:               { dot: 'bg-accent-gold', text: 'text-accent-gold', bg: 'bg-accent-gold-dim' },
  'awaiting verification': { dot: 'bg-accent-gold', text: 'text-accent-gold', bg: 'bg-accent-gold-dim' },
  assigned:              { dot: 'bg-accent-gold', text: 'text-accent-gold', bg: 'bg-accent-gold-dim' },
  acknowledged:          { dot: 'bg-accent-gold', text: 'text-accent-gold', bg: 'bg-accent-gold-dim' },

  // In-progress
  'en route':        { dot: 'bg-warning-orange', text: 'text-warning-orange', bg: 'bg-warning-orange/10' },
  'client picked up':{ dot: 'bg-warning-orange', text: 'text-warning-orange', bg: 'bg-warning-orange/10' },
  'in transit':      { dot: 'bg-warning-orange', text: 'text-warning-orange', bg: 'bg-warning-orange/10' },

  // Error / danger
  error:       { dot: 'bg-danger-red', text: 'text-danger-red', bg: 'bg-danger-red/10' },
  critical:    { dot: 'bg-danger-red', text: 'text-danger-red', bg: 'bg-danger-red/10' },
  'sos active':{ dot: 'bg-danger-red', text: 'text-danger-red', bg: 'bg-danger-red/10' },
  rejected:    { dot: 'bg-danger-red', text: 'text-danger-red', bg: 'bg-danger-red/10' },
  'off duty':  { dot: 'bg-danger-red', text: 'text-danger-red', bg: 'bg-danger-red/10' },
};

const DEFAULT_STYLE = { dot: 'bg-text-muted', text: 'text-text-secondary', bg: 'bg-border-subtle' };

const StatusBadge = ({ status }) => {
  const key = status?.toLowerCase() ?? '';
  const style = STATUS_MAP[key] ?? DEFAULT_STYLE;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-medium whitespace-nowrap
        ${style.bg} ${style.text}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
