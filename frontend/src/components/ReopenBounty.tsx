import { useState } from "react";
import { useTranslation } from "../i18n";
import { DeadlineInput } from "./ExtendDeadline";

interface ReopenBountyProps {
  bountyId: string;
  onReopen: (bountyId: string, newDeadline: number) => Promise<void> | void;
  disabled?: boolean;
}

/**
 * Reopen action for expired bounties. Renders a new-deadline picker (reusing
 * the deadline input from ExtendDeadline) and calls `reopen_bounty` with the
 * selected deadline. Visibility/role gating is handled by the caller.
 */
export function ReopenBounty({ bountyId, onReopen, disabled }: ReopenBountyProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (deadline == null) {
      setError(t("reopen_deadline_required"));
      return;
    }
    if (deadline * 1000 <= Date.now()) {
      setError(t("reopen_deadline_future"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onReopen(bountyId, deadline);
      setOpen(false);
      setDeadline(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reopen_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className="bounty-card__reopen"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        {t("reopen_bounty")}
      </button>
    );
  }

  return (
    <div className="bounty-card__reopen-form">
      <DeadlineInput value={deadline} onChange={setDeadline} />
      {error && (
        <span className="bounty-card__reopen-error" role="alert">
          {error}
        </span>
      )}
      <div className="bounty-card__reopen-actions">
        <button
          type="button"
          className="bounty-card__reopen-submit"
          onClick={handleSubmit}
          disabled={submitting || disabled}
        >
          {submitting ? t("reopen_submitting") : t("reopen_confirm")}
        </button>
        <button
          type="button"
          className="bounty-card__reopen-cancel"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={submitting}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
