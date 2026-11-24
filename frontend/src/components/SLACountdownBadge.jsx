import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function SLACountdownBadge({ 
  slaDeadline, 
  status, 
  slaStatus, 
  showIcon = true,
  compact = false 
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Tick every 15 seconds to keep countdown accurate without draining CPU
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const isResolved = ['RESOLVED', 'CITIZEN_VERIFIED', 'CLOSED'].includes(status);

  if (isResolved) {
    const wasOverdue = slaStatus === 'RESOLVED_OVERDUE';
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        compact ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1'
      } ${
        wasOverdue 
          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
      }`}>
        <CheckCircle className="w-3.5 h-3.5" />
        {wasOverdue ? 'Resolved (Overdue)' : 'Resolved On Time'}
      </span>
    );
  }

  if (!slaDeadline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 font-medium text-slate-500 bg-slate-100 rounded-full border border-slate-200">
        <Clock className="w-3.5 h-3.5" />
        24h SLA Active
      </span>
    );
  }

  const deadlineMs = new Date(slaDeadline).getTime();
  const diffMs = deadlineMs - now;

  // Format hours and minutes
  const formatTime = (ms) => {
    const totalMinutes = Math.floor(Math.abs(ms) / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}h ${pad(minutes)}m`;
  };

  // Breached case
  if (diffMs <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full animate-pulse ${
        compact ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1'
      } bg-rose-50 text-rose-700 border border-rose-300`}>
        {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
        <span>SLA BREACHED — {formatTime(diffMs)} overdue</span>
      </span>
    );
  }

  const diffHours = diffMs / (1000 * 60 * 60);

  // Style tiers
  let colorClasses = '';
  let IconComponent = Clock;

  if (diffHours > 12) {
    // Green (>12h)
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    IconComponent = Clock;
  } else if (diffHours >= 6) {
    // Yellow/Amber (6h - 12h)
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    IconComponent = Clock;
  } else if (diffHours >= 1) {
    // Orange (1h - 6h)
    colorClasses = 'bg-orange-50 text-orange-800 border-orange-200 font-semibold';
    IconComponent = AlertTriangle;
  } else {
    // Red (<1h)
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse';
    IconComponent = AlertTriangle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${
      compact ? 'text-xs px-2.5 py-0.5' : 'text-xs px-3 py-1'
    } ${colorClasses}`}>
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{formatTime(diffMs)} remaining</span>
    </span>
  );
}
