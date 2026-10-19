import { useCallback, useEffect, useRef, useState } from 'react';
import { Horizon } from '@stellar/stellar-sdk';

const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ?? 'https://horizon-testnet.stellar.org';

// Estimated network fee (in XLM) reserved when the selected token is native XLM.
// Covers the base fee plus a small buffer for the create-bounty transaction.
const ESTIMATED_FEE_XLM = 0.01;

export interface WalletBalanceState {
  /** Raw balance of the selected token (fees already deducted for native XLM). */
  balance: number;
  /** Balance before fee deduction, useful for display/debugging. */
  rawBalance: number;
  /** Estimated fee reserved on native XLM (0 for other tokens). */
  estimatedFee: number;
  loading: boolean;
  error: string | null;
  /** True when the reward amount exceeds the available balance. */
  insufficient: boolean;
  refresh: () => void;
}

interface UseWalletBalanceOptions {
  /** Connected account public key, or null when no wallet is connected. */
  publicKey: string | null;
  /** Asset code of the selected token (e.g. "XLM", "USDC"). */
  tokenCode: string | null;
  /** Issuer of the selected token; ignored for native XLM. */
  tokenIssuer?: string | null;
  /** Reward amount entered in the create bounty form. */
  rewardAmount: number;
}

const isNative = (code: string | null) => !code || code.toUpperCase() === 'XLM';

export function useWalletBalance({
  publicKey,
  tokenCode,
  tokenIssuer,
  rewardAmount,
}: UseWalletBalanceOptions): WalletBalanceState {
  const [rawBalance, setRawBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestId = useRef(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!publicKey) {
      setRawBalance(0);
      setError(null);
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    let cancelled = false;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const server = new Horizon.Server(HORIZON_URL);
        const account = await server.loadAccount(publicKey);

        if (cancelled || currentRequest !== requestId.current) return;

        const native = isNative(tokenCode);
        const line = account.balances.find((b) => {
          if (native) return b.asset_type === 'native';
          if (b.asset_type === 'native') return false;
          return (
            b.asset_code === tokenCode &&
            (!tokenIssuer || b.asset_issuer === tokenIssuer)
          );
        });

        setRawBalance(line ? parseFloat(line.balance) : 0);
      } catch (err) {
        if (cancelled || currentRequest !== requestId.current) return;
        setRawBalance(0);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch wallet balance',
        );
      } finally {
        if (!cancelled && currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [publicKey, tokenCode, tokenIssuer, reloadKey]);

  const estimatedFee = isNative(tokenCode) ? ESTIMATED_FEE_XLM : 0;
  const balance = Math.max(rawBalance - estimatedFee, 0);
  const insufficient = rewardAmount > 0 && rewardAmount > balance;

  return {
    balance,
    rawBalance,
    estimatedFee,
    loading,
    error,
    insufficient,
    refresh,
  };
}
