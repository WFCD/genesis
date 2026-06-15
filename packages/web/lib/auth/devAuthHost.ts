import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Redirect to AUTH_URL host when request host differs so OAuth PKCE cookies survive callback. */
export function devAuthRedirect(request: NextRequest) {
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!authUrl) return null;

  try {
    const canonical = new URL(authUrl);
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
    if (!host || host === canonical.host) return null;

    const url = request.nextUrl.clone();
    url.protocol = canonical.protocol;
    url.host = canonical.host;
    return NextResponse.redirect(url);
  } catch {
    return null;
  }
}
