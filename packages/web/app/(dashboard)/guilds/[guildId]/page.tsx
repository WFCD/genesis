import { Suspense, type FC } from 'react';

import GuildDashboard from '@/components/GuildDashboard';
import LoadingIndicator from '@/components/dashboard/LoadingIndicator';

const GuildPage: FC = () => (
  <Suspense fallback={<LoadingIndicator label="Loading guild settings…" />}>
    <GuildDashboard />
  </Suspense>
);

export default GuildPage;
