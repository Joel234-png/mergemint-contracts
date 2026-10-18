import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export interface ReputationHistoryEntry {
  id?: string | number;
  date: string;
  amount: number;
  reason?: string;
  reputation?: number;
}

interface ReputationChartProps {
  /** Optional pre-fetched history; when omitted the component fetches it. */
  history?: ReputationHistoryEntry[];
  /** Optional user/address to fetch history for. */
  address?: string;
}

interface ChartPoint {
  date: string;
  value: number;
  reason?: string;
  delta: number;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING = 24;

function buildPoints(history: ReputationHistoryEntry[]): ChartPoint[] {
  const sorted = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  let running = 0;
  return sorted.map((entry) => {
    running += entry.amount ?? 0;
    return {
      date: entry.date,
      value: typeof entry.reputation === 'number' ? entry.reputation : running,
      reason: entry.reason,
      delta: entry.amount ?? 0,
    };
  });
}

export default function ReputationChart({ history, address }: ReputationChartProps) {
  const [entries, setEntries] = useState<ReputationHistoryEntry[]>(history ?? []);
  const [loading, setLoading] = useState(!history);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (history) {
      setEntries(history);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getReputationHistory(address)
      .then((data: ReputationHistoryEntry[]) => {
        if (!cancelled) setEntries(data ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reputation history');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [history, address]);

  const points = useMemo(() => buildPoints(entries), [entries]);

  const { path, areaPath, coords } = useMemo(() => {
    if (points.length === 0) {
      return { path: '', areaPath: '', coords: [] as { x: number; y: number }[] };
    }
    const values = points.map((p) => p.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;
    const innerW = CHART_WIDTH - PADDING * 2;
    const innerH = CHART_HEIGHT - PADDING * 2;
    const step = points.length > 1 ? innerW / (points.length - 1) : 0;
    const c = points.map((p, i) => ({
      x: PADDING + i * step,
      y: PADDING + innerH - ((p.value - min) / range) * innerH,
    }));
    const line = c.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');
    const area = `${line} L${c[c.length - 1].x},${CHART_HEIGHT - PADDING} L${c[0].x},${CHART_HEIGHT - PADDING} Z`;
    return { path: line, areaPath: area, coords: c };
  }, [points]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
        Loading reputation history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
        No reputation history yet.
      </div>
    );
  }

  const active = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div className="w-full">
      <div className="relative w-full">
        <svg
          role="img"
          aria-label="Reputation over time"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-48 w-full"
          preserveAspectRatio="none"
        >
          <path d={areaPath} fill="rgba(59,130,246,0.15)" />
          <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} />
          {coords.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={activeIndex === i ? 5 : 3}
              fill="#3b82f6"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(i)}
              onBlur={() => setActiveIndex(null)}
              tabIndex={0}
            >
              <title>
                {`${new Date(points[i].date).toLocaleDateString()}: ${points[i].value}` +
                  (points[i].reason ? ` — ${points[i].reason}` : '')}
              </title>
            </circle>
          ))}
        </svg>
        {active && (
          <div className="pointer-events-none absolute left-2 top-2 rounded bg-gray-900 px-2 py-1 text-xs text-white">
            <div>{new Date(active.date).toLocaleDateString()}</div>
            <div>Reputation: {active.value}</div>
            {active.reason && <div>Reason: {active.reason}</div>}
          </div>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">
          View reputation history as table
        </summary>
        <table className="mt-2 w-full text-left text-sm">
          <caption className="sr-only">Reputation history</caption>
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="py-1 pr-2">Date</th>
              <th scope="col" className="py-1 pr-2">Change</th>
              <th scope="col" className="py-1 pr-2">Reputation</th>
              <th scope="col" className="py-1">Reason</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-1 pr-2">{new Date(p.date).toLocaleDateString()}</td>
                <td className="py-1 pr-2">{p.delta > 0 ? `+${p.delta}` : p.delta}</td>
                <td className="py-1 pr-2">{p.value}</td>
                <td className="py-1">{p.reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
