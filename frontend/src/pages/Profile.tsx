import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReputationChart from '../components/ReputationChart';
import { api } from '../lib/api';

interface ProfileData {
  address: string;
  username?: string;
  reputation: number;
}

export default function Profile() {
  const { address } = useParams<{ address: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getProfile(address)
      .then((data: ProfileData) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading profile…</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  if (!profile) {
    return <div className="p-6 text-sm text-gray-500">Profile not found.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">
          {profile.username ?? profile.address}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Reputation: <span className="font-medium">{profile.reputation}</span>
        </p>
      </header>

      <section aria-labelledby="reputation-history-heading">
        <h2 id="reputation-history-heading" className="mb-3 text-lg font-medium">
          Reputation history
        </h2>
        <ReputationChart address={profile.address} />
      </section>
    </div>
  );
}
