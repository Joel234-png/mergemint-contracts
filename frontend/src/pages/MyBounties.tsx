import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreatorBounties } from '../hooks/useCreatorBounties';
import { BountyCard } from '../components/BountyCard';
import { BountyActions } from '../components/BountyActions';
import { Pagination } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import type { Bounty, BountyStatus } from '../types/bounty';

const STATUS_ORDER: BountyStatus[] = [
  'open',
  'in_progress',
  'submitted',
  'completed',
  'cancelled',
  'expired',
];

const STATUS_LABELS: Record<BountyStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  submitted: 'Submitted',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const PAGE_SIZE = 10;

export default function MyBounties() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useCreatorBounties({
    page,
    pageSize: PAGE_SIZE,
  });

  const grouped = useMemo(() => {
    const groups: Record<string, Bounty[]> = {};
    for (const bounty of data?.items ?? []) {
      (groups[bounty.status] ??= []).push(bounty);
    }
    return groups;
  }, [data]);

  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-600">Failed to load your bounties.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasBounties = (data?.items?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My bounties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the bounties you created.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create bounty
        </Link>
      </div>

      {!hasBounties ? (
        <div className="mt-12">
          <EmptyState
            title="No bounties yet"
            description="Bounties you create will appear here."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {STATUS_ORDER.filter((status) => grouped[status]?.length).map(
            (status) => (
              <section key={status} aria-labelledby={`group-${status}`}>
                <h2
                  id={`group-${status}`}
                  className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-900"
                >
                  {STATUS_LABELS[status]}
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {grouped[status].length}
                  </span>
                </h2>
                <ul className="space-y-4">
                  {grouped[status].map((bounty) => (
                    <li key={bounty.id}>
                      <BountyCard bounty={bounty}>
                        <BountyActions bounty={bounty} onSuccess={refetch} />
                      </BountyCard>
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
