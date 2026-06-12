import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import OwnerSuPanel from '@/components/OwnerSuPanel';
import { isBotOwner } from '@/lib/auth/ownerAuth';

const SuPage = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  if (!isBotOwner(session.user.id)) redirect('/');

  return <OwnerSuPanel />;
};

export default SuPage;
