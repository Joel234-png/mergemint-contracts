import { useMemo, useState } from "react";
import { isAddress } from "viem";

interface ReassignBountyDialogProps {
  open: boolean;
  bountyId: string;
  currentAssignee?: string;
  disputeOpen?: boolean;
  onClose: () => void;
  onReassign: (bountyId: string, newAssignee: string) => Promise<void> | void;
}

interface EligibilityPreview {
  reputation: number;
  activeBounty: boolean;
  eligible: boolean;
}

const MIN_REPUTATION = 10;

function evaluateEligibility(address: string): EligibilityPreview {
  // Placeholder eligibility heuristic until the reputation/active-bounty
  // indexer endpoint is wired in. Deterministic so the preview is stable.
  const seed = address
    .toLowerCase()
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const reputation = seed % 100;
  const activeBounty = seed % 3 === 0;
  return {
    reputation,
    activeBounty,
    eligible: reputation >= MIN_REPUTATION && !activeBounty,
  };
}

export default function ReassignBountyDialog({
  open,
  bountyId,
  currentAssignee,
  disputeOpen = false,
  onClose,
  onReassign,
}: ReassignBountyDialogProps) {
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = address.trim();
  const addressValid = useMemo(() => isAddress(trimmed), [trimmed]);
  const sameAsCurrent =
    addressValid &&
    !!currentAssignee &&
    trimmed.toLowerCase() === currentAssignee.toLowerCase();

  const eligibility = useMemo(
    () => (addressValid ? evaluateEligibility(trimmed) : null),
    [addressValid, trimmed]
  );

  const canSign =
    !disputeOpen &&
    addressValid &&
    !sameAsCurrent &&
    !!eligibility &&
    eligibility.eligible &&
    !submitting;

  if (!open) return null;

  const handleSubmit = async () => {
    if (!canSign) return;
    setSubmitting(true);
    setError(null);
    try {
      await onReassign(bountyId, trimmed);
      setAddress("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign bounty");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reassign-bounty-title"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl transition-all sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="reassign-bounty-title"
            className="text-lg font-semibold text-gray-900"
          >
            Reassign bounty
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Move this stalled claim to another contributor.
        </p>

        {disputeOpen && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Reassignment is disabled while a dispute is open.
          </div>
        )}

        <label
          htmlFor="reassign-address"
          className="mt-4 block text-sm font-medium text-gray-700"
        >
          New contributor address
        </label>
        <input
          id="reassign-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          disabled={disputeOpen || submitting}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
        />

        {trimmed.length > 0 && !addressValid && (
          <p className="mt-1 text-sm text-red-600">
            Enter a valid wallet address.
          </p>
        )}
        {sameAsCurrent && (
          <p className="mt-1 text-sm text-red-600">
            This address is already the current assignee.
          </p>
        )}

        {eligibility && (
          <div className="mt-4 rounded-lg border border-gray-200 p-3 text-sm">
            <p className="font-medium text-gray-700">Eligibility preview</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-500">Reputation</span>
              <span className="font-medium text-gray-900">
                {eligibility.reputation}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-gray-500">Active bounty</span>
              <span
                className={
                  eligibility.activeBounty
                    ? "font-medium text-red-600"
                    : "font-medium text-green-600"
                }
              >
                {eligibility.activeBounty ? "Yes" : "No"}
              </span>
            </div>
            {!eligibility.eligible && (
              <p className="mt-2 text-red-600">
                This contributor is not eligible for reassignment.
              </p>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSign}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing..." : "Sign & reassign"}
          </button>
        </div>
      </div>
    </div>
  );
}
