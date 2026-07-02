'use server';

import { signOut } from '@/auth';

export const signOutUser = async () => {
  await signOut();
};
