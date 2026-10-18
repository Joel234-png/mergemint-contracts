import { useEffect, useMemo, useState } from 'react';

interface DeadlineCountdownProps {
  deadline: string | number | Date;
  className?: string;
  onExpire?: () => void;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WARNING_THRESHOLD = DAY;

function getRemaining(deadlineMs: number): number {
  return Math.max(0, deadlineMs - Date.now());
}

function formatRemaining(remaining: number): string {
  if (remaining <= 0) {
    return 'Expired';
  }

  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  return reduced;
}

export default function DeadlineCountdown({
  deadline,
  className = '',
  onExpire,
}: DeadlineCountdownProps) {
  const deadlineMs = useMemo(() => new Date(deadline).getTime(), [deadline]);
  const [remaining, setRemaining] = useState(() => getRemaining(deadlineMs));
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setRemaining(getRemaining(deadlineMs));

    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const next = getRemaining(deadlineMs);
      setRemaining(next);

      if (next <= 0) {
        onExpire?.();
        return;
      }

      const interval = next <= HOUR ? 1000 : MINUTE;
      timeoutId = setTimeout(tick, interval);
    };

    const initialInterval = getRemaining(deadlineMs) <= HOUR ? 1000 : MINUTE;
    timeoutId = setTimeout(tick, initialInterval);

    return () => clearTimeout(timeoutId);
  }, [deadlineMs, onExpire]);

  const isExpired = remaining <= 0;
  const isWarning = !isExpired && remaining <= WARNING_THRESHOLD;

  const baseClasses =
    'inline-flex items-center gap-1 text-sm font-medium tabular-nums';
  const stateClasses = isExpired
    ? 'text-red-600'
    : isWarning
      ? 'text-amber-600'
      : 'text-gray-600';
  const motionClasses = prefersReducedMotion
    ? ''
    : 'transition-colors duration-300';

  return (
    <span
      className={`${baseClasses} ${stateClasses} ${motionClasses} ${className}`.trim()}
      role="timer"
      aria-live={isWarning ? 'polite' : 'off'}
      aria-label={isExpired ? 'Deadline expired' : `Time remaining: ${formatRemaining(remaining)}`}
    >
      {isExpired ? 'Expired' : formatRemaining(remaining)}
    </span>
  );
}
