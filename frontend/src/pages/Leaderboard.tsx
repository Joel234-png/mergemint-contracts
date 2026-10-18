import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { LeaderboardEntry } from '../types';
import { mapErrorMessage } from '../utils/format';
import { shortenAddress } from '../utils/format';

/** Time ranges supported by the leaderboard filter (#1069). */
type LeaderboardRange = 'weekly' | 'monthly' | 'all-time';

const RANGE_TABS: { value: LeaderboardRange; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'all-time', label: 'All-time' },
];

const DEFAULT_RANGE: LeaderboardRange = 'all-time';

function parseRange(value: string | null): LeaderboardRange {
  return RANGE_TABS.some((tab) => tab.value === value)
    ? (value as LeaderboardRange)
    : DEFAULT_RANGE;
}

/** Rank badge colours: gold / silver / bronze for the top three. */
function RankBadge({ rank }: { rank: number }) {
  const modifier =
    rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';

  return (
    <span
      className={`leaderboard__rank-badge leaderboard__rank-badge--${modifier}`}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

/**
 * Leaderboard page (#897).
 * Shows the top 50 contributors with rank badges, reputation score,
 * and completed bounty count. Each row links to the contributor profile.
 *
 * The time range filter (#1069) lets users switch between weekly, monthly,
 * and all-time rankings. The selected range is kept in the URL (?range=…)
 * and passed to the backend leaderboard route.
 */
export function Leaderboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = parseRange(searchParams.get('range'));

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getLeaderboard({ range })
      .then((page) => {
        if (!cancelled) setEntries(page.entries);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(mapErrorMessage(err instanceof Error ? err.message : String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const handleRangeChange = (next: LeaderboardRange) => {
    const params = new URLSearchParams(searchParams);
    params.set('range', next);
    setSearchParams(params, { replace: true });
  };

  const rangeTabs = (
    <div className="leaderboard__tabs" role="tablist" aria-label="Leaderboard time range">
      {RANGE_TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={range === tab.value}
          className={`leaderboard__tab${
            range === tab.value ? ' leaderboard__tab--active' : ''
          }`}
          onClick={() => handleRangeChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <main className="leaderboard">
        <h1 className="leaderboard__heading">Leaderboard</h1>
        {rangeTabs}
        <p aria-busy="true">Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="leaderboard">
        <h1 className="leaderboard__heading">Leaderboard</h1>
        {rangeTabs}
        <p role="alert">{error}</p>
      </main>
    );
  }

  if (entries.length === 0) {
    return (
      <main className="leaderboard">
        <h1 className="leaderboard__heading">Leaderboard</h1>
        {rangeTabs}
        <p className="leaderboard__empty">No contributors yet.</p>
      </main>
    );
  }

  return (
    <main className="leaderboard">
      <h1 className="leaderboard__heading">Leaderboard</h1>

      {rangeTabs}

      <table className="leaderboard__table">
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Contributor</th>
            <th scope="col" className="leaderboard__th--numeric">
              Reputation
            </th>
            <th scope="col" className="leaderboard__th--numeric">
              Completed
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.address} className="leaderboard__row">
              <td className="leaderboard__cell--rank">
                <RankBadge rank={entry.rank} />
              </td>
              <td className="leaderboard__cell--address">
                <Link
                  to={`/contributors/${entry.address}`}
                  className="leaderboard__link"
                  title={entry.address}
                >
                  {shortenAddress(entry.address, 6, 6)}
                </Link>
              </td>
              <td className="leaderboard__cell--numeric">
                {entry.reputation.toLocaleString()}
              </td>
              <td className="leaderboard__cell--numeric">{entry.completedBounties}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
