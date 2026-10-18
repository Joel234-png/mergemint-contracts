import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Spinner } from './components/Spinner';

const Home = lazy(() => import('./pages/Home'));
const Bounties = lazy(() => import('./pages/Bounties'));
const BountyDetail = lazy(() => import('./pages/BountyDetail'));
const CreateBounty = lazy(() => import('./pages/CreateBounty'));
const MyBounties = lazy(() => import('./pages/MyBounties'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bounties" element={<Bounties />} />
          <Route path="/bounties/new" element={<CreateBounty />} />
          <Route path="/bounties/:id" element={<BountyDetail />} />
          <Route path="/my-bounties" element={<MyBounties />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
