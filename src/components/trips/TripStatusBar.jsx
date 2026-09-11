import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  { key: 'Assigned',       label: 'Assigned'  },
  { key: 'Acknowledged',   label: 'Confirmed' },
  { key: 'En Route',       label: 'En route'  },
  { key: 'Client Picked Up', label: 'Picked up' },
  { key: 'In Transit',     label: 'In transit' },
  { key: 'Trip Complete',  label: 'Done'      },
];

/**
 * TripStatusBar — horizontal progress stepper for the trip detail view.
 * Displays step dots with a gold connecting line and labels beneath.
 */
const TripStatusBar = ({ currentStatus }) => {
  const currentIdx = STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="w-full px-1 py-4">
      {/* Dot row */}
      <div className="relative flex items-center justify-between">
        {/* Track line: base */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-card-raised" />
        {/* Track line: progress */}
        <div
          className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-accent-gold transition-all duration-500 ease-out"
          style={{
            width: currentIdx < 0
              ? '0%'
              : `${(currentIdx / (STEPS.length - 1)) * (100 - (8 / STEPS.length * 100))}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const done    = currentIdx > idx;
          const current = currentIdx === idx;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
                  ${done
                    ? 'bg-accent-gold text-primary-dark'
                    : current
                    ? 'bg-primary-dark border-2 border-accent-gold text-accent-gold ring-4 ring-accent-gold/15'
                    : 'bg-card border-2 border-border-subtle text-text-muted'
                  }
                `}
              >
                {done
                  ? <Check size={13} strokeWidth={3} />
                  : <span className={`w-2 h-2 rounded-full ${current ? 'bg-accent-gold' : 'bg-text-muted/30'}`} />
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex justify-between mt-2.5 px-0">
        {STEPS.map((step, idx) => {
          const done    = currentIdx > idx;
          const current = currentIdx === idx;
          return (
            <span
              key={step.key}
              className={`
                text-[10px] font-medium text-center leading-tight transition-colors duration-300
                ${current
                  ? 'text-accent-gold'
                  : done
                  ? 'text-text-secondary'
                  : 'text-text-muted/50'
                }
              `}
              style={{ width: `${100 / STEPS.length}%` }}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default TripStatusBar;
