import 'server-only';

import { auth } from '@/auth';
import env from '@/lib/env';

export function isBotOwner(userId?: string | null) {
  if (!userId || !env.owner) return false;
  return userId === env.owner.trim();
}

export async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id || !isBotOwner(session.user.id)) {
    throw new Response('Forbidden', { status: 403 });
  }
  return session;
}
