import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Bounty } from '../types';
import { mapErrorMessage } from '../utils/format';
import { StatusBadge } from '../components/StatusBadge';
import { BountyDetailSkeleton } from '../components/BountyDetailSkeleton';
import { BountyErrorBoundary } from '../components/BountyErrorBoundary';
import { TopUpModal } from '../components/TopUpModal';
import { SponsorModal, Sponsor } from '../components/SponsorModal';
import { ExtendDeadline } from '../components/ExtendDeadline';
import { CancelBountyDialog } from '../components/CancelBountyDialog';
import { MilestoneTracker } from '../components/MilestoneTracker';
import { useWallet } from '../lib/WalletContext';
import { CONFIGURED_NETWORK } from '../lib/network';
import { useTranslation } from '../i18n';

/**
 * Inner component rendering the bounty details, claim action, and creator top-up controls.
 *
 * @returns React element displaying bounty details or loading/error states.
 */
function BountyDetailInner() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();
  const { t } = useTranslation();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal/dialog visibility flags.
  const [showTopUp, setShowTopUp] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showSponsor, setShowSponsor] = useState(false);

  function fetchBounty() {
    if (!id) return;
    setLoading(true);
    api
      .getBounty(id)
      .then(setBounty)
      .catch((err) => setError(mapErrorMessage(err instanceof Error ? err.message : String(err))))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchBounty();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = useCallback(async () => {
    if (!id) return;
    setClaiming(true);
    setError(null);
    try {
      const updated = await api.claimBounty(id);
      setBounty(updated);
    } catch (err) {
      setError(mapErrorMessage(err instanceof Error ? err.message : String(err)));
    } finally {
      setClaiming(false);
    }
  }, [id]);

  const handleTopUp = useCallback(
    async (amount: string) => {
      if (!id || !bounty) return;
      await api.topUpBounty(id, amount, bounty.rewardToken ?? '');
      fetchBounty();
    },
    [id, bounty] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleCancel = useCallback(async () => {
    if (!id) return;
    await api.cancelBounty(id);
    setShowCancel(false);
    fetchBounty();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !bounty) return <BountyDetailSkeleton />;
  if (error && !bounty) return <p role="alert">{error}</p>;
  if (!bounty) return <p>{t('loading')}</p>;

  const isCreator = Boolean(
    address && bounty.creator && address.toLowerCase() === bounty.creator.toLowerCase()
  );

  const isOpen = bounty.status === 'open';

  const sponsors: Sponsor[] = (bounty.sponsors ?? []).map((s) => ({
    address: s.address,
    amount: s.amount,
  }));

  return (
    <div className="bounty-detail-page">
      <h1>{bounty.title}</h1>
      <StatusBadge status={bounty.status} />
      <p>{bounty.description}</p>
      <div className="bounty-reward">
        <strong>Reward:</strong> {bounty.reward} XLM
      </div>
      <div className="bounty-creator">
        <strong>Creator:</strong> {bounty.creator}
      </div>
      {error && <p role="alert">{error}</p>}
      <MilestoneTracker milestones={bounty.milestones} totalReward={bounty.reward} />
      <button onClick={handleClaim} disabled={claiming || !isOpen}>
        {claiming ? t('claiming') : t('claim_bounty')}
      </button>
      {isOpen && (
        <button
          type="button"
          onClick={() => setShowSponsor(true)}
          className="sponsor-open-button"
        >
          Sponsor Bounty
        </button>
      )}
      {isCreator && isOpen && (
        <>
          <button
            type="button"
            onClick={() => setShowTopUp(true)}
            className="topup-open-button"
          >
            Top Up Bounty
          </button>
          <button
            type="button"
            onClick={() => setShowCancel(true)}
            className="cancel-open-button"
          >
            Cancel Bounty
          </button>
        </>
      )}
      {isCreator && bounty.deadline != null && (
        <ExtendDeadline bounty={bounty} network={CONFIGURED_NETWORK} onSuccess={fetchBounty} />
      )}
      <div className="bounty-sponsors">
        <h2>Sponsors</h2>
        {sponsors.length === 0 ? (
          <p className="bounty-sponsors-empty">No sponsors yet.</p>
        ) : (
          <ul>
            {sponsors.map((sponsor) => (
              <li key={sponsor.address} className="bounty-sponsor">
                <span className="bounty-sponsor-address">{sponsor.address}</span>
                <span className="bounty-sponsor-amount">
                  {sponsor.amount} {bounty.rewardToken ?? 'XLM'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        bountyId={bounty.id}
        currentReward={bounty.reward}
        rewardToken="XLM"
        isCreator={isCreator}
        onTopUp={handleTopUp}
      />
      <SponsorModal
        isOpen={showSponsor}
        onClose={() => setShowSponsor(false)}
        bountyId={bounty.id}
        rewardToken={bounty.rewardToken ?? 'XLM'}
        sponsors={sponsors}
        onSponsored={fetchBounty}
      />
      <CancelBountyDialog
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        bounty={bounty}
        refundAmount={bounty.reward}
        rewardToken="XLM"
        onConfirm={handleCancel}
      />
    </div>
  );
}

/**
 * Root BountyDetail page wrapped with BountyErrorBoundary.
 *
 * @returns React element for the routed bounty detail page.
 */
export function BountyDetail() {
  return (
    <BountyErrorBoundary>
      <BountyDetailInner />
    </BountyErrorBoundary>
  );
}
