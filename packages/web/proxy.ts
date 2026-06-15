import NextAuth from 'next-auth';

import { authConfig } from './auth.config';
import { devAuthRedirect } from './lib/auth/devAuthHost';

const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  const redirect = devAuthRedirect(request);
  if (redirect) return redirect;
});

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|.*\\..*).*)'],
};
