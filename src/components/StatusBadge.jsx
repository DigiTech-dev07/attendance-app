import React from 'react';
import { CheckCircle2, Radio, Circle, Clock, CheckCheck, XCircle } from 'lucide-react';

export function StatusBadge({ status, className = '' }) {
  const normStatus = (status || '').toUpperCase();

  switch (normStatus) {
    case 'MARKED':
    case 'ATTENDANCE MARKED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-mint-light text-mint-dark border-2 border-mint-dark shadow-sm ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>✓ Marked</span>
        </span>
      );

    case 'ACTIVE':
    case 'LOCATION ACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-sunshine-light text-ink border-2 border-black shadow-sm ${className}`}
        >
          <Radio className="w-3.5 h-3.5 text-coral animate-pulse" />
          <span>● Location Active</span>
        </span>
      );

    case 'EXPIRED':
    case 'TRACKING EXPIRED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-neutral-200 text-neutral-700 border-2 border-neutral-400 shadow-sm ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-neutral-600" />
          <span>⌛ Tracking Expired</span>
        </span>
      );

    case 'STOPPED':
    case 'TRIP COMPLETED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-electric-dark border-2 border-electric shadow-sm ${className}`}
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>✓ Trip Completed</span>
        </span>
      );

    case 'STARTED':
    case 'TRIP STARTED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border-2 border-emerald-600 shadow-sm ${className}`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>⚡ Trip Started</span>
        </span>
      );

    case 'NOT_MARKED':
    case 'NOT MARKED':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-neutral-100 text-neutral-600 border-2 border-neutral-300 shadow-sm ${className}`}
        >
          <Circle className="w-3.5 h-3.5" />
          <span>○ Not Marked</span>
        </span>
      );
  }
}

export default StatusBadge;
