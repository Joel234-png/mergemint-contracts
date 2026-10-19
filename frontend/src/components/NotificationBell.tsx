import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBountyStream } from '../hooks/useBountyStream';
import { useWallet } from '../hooks/useWallet';

const STORAGE_KEY = 'bounty-notifications-read';

type NotificationKind = 'claim' | 'approval' | 'payout';

interface BountyEvent {
  type?: string;
  event?: string;
  bountyId?: string | number;
  id?: string | number;
  owner?: string;
  creator?: string;
  hunter?: string;
  contributor?: string;
  recipient?: string;
  address?: string;
  amount?: string | number;
  title?: string;
  message?: string;
  timestamp?: string | number;
  [key: string]: unknown;
}

interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  timestamp: number;
}

const normalize = (value?: string | null) => (value ? value.toLowerCase() : '');

const readStoredIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const writeStoredIds = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
};

const resolveKind = (event: BountyEvent): NotificationKind | null => {
  const raw = normalize((event.type ?? event.event ?? '') as string);
  if (raw.includes('claim')) return 'claim';
  if (raw.includes('approv')) return 'approval';
  if (raw.includes('payout') || raw.includes('paid') || raw.includes('payment')) return 'payout';
  return null;
};

const resolveTimestamp = (event: BountyEvent): number => {
  const value = event.timestamp;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return Date.now();
};

const formatRelative = (timestamp: number): string => {
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const buildNotification = (event: BountyEvent, kind: NotificationKind, index: number): NotificationItem => {
  const bountyId = event.bountyId ?? event.id ?? 'unknown';
  const timestamp = resolveTimestamp(event);
  const id = `${kind}-${bountyId}-${timestamp}-${index}`;
  const amount = event.amount != null ? ` (${event.amount})` : '';

  const titles: Record<NotificationKind, string> = {
    claim: 'New claim on your bounty',
    approval: 'Bounty approval',
    payout: 'Payout received',
  };

  const messages: Record<NotificationKind, string> = {
    claim: `Bounty #${bountyId} received a new claim.`,
    approval: `Bounty #${bountyId} was approved.`,
    payout: `You received a payout for bounty #${bountyId}${amount}.`,
  };

  return {
    id,
    kind,
    title: event.title ?? titles[kind],
    message: event.message ?? messages[kind],
    timestamp,
  };
};

export default function NotificationBell() {
  const { address } = useWallet();
  const { events } = useBountyStream();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => readStoredIds());
  const containerRef = useRef<HTMLDivElement | null>(null);

  const connected = normalize(address);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!connected || !Array.isArray(events)) return [];

    const result: NotificationItem[] = [];
    (events as BountyEvent[]).forEach((event, index) => {
      if (!event || typeof event !== 'object') return;
      const kind = resolveKind(event);
      if (!kind) return;

      const owner = normalize((event.owner ?? event.creator) as string);
      const hunter = normalize((event.hunter ?? event.contributor) as string);
      const recipient = normalize((event.recipient ?? event.address) as string);

      const relevant =
        (kind === 'claim' && owner === connected) ||
        (kind === 'approval' && (owner === connected || hunter === connected)) ||
        (kind === 'payout' && (recipient === connected || hunter === connected));

      if (!relevant) return;
      result.push(buildNotification(event, kind, index));
    });

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [events, connected]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readIds.includes(item.id)).length,
    [notifications, readIds],
  );

  const persistRead = useCallback((ids: string[]) => {
    setReadIds(ids);
    writeStoredIds(ids);
  }, []);

  const markAllRead = useCallback(() => {
    const merged = Array.from(new Set([...readIds, ...notifications.map((item) => item.id)]));
    persistRead(merged);
  }, [notifications, persistRead, readIds]);

  const markRead = useCallback(
    (id: string) => {
      if (readIds.includes(id)) return;
      persistRead([...readIds, id]);
    },
    [persistRead, readIds],
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!connected) return null;

  return (
    <div className="notification-bell" ref={containerRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-bell__panel" role="menu">
          <div className="notification-bell__header">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button type="button" className="notification-bell__mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="notification-bell__empty">No notifications yet.</p>
          ) : (
            <ul className="notification-bell__list">
              {notifications.map((item) => {
                const isUnread = !readIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className={`notification-bell__item${isUnread ? ' notification-bell__item--unread' : ''}`}
                  >
                    <button type="button" className="notification-bell__item-button" onClick={() => markRead(item.id)}>
                      <span className="notification-bell__item-title">{item.title}</span>
                      <span className="notification-bell__item-message">{item.message}</span>
                      <span className="notification-bell__item-time">{formatRelative(item.timestamp)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
