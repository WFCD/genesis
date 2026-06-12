import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Dev-only: redirect 127.0.0.1 / LAN host to AUTH_URL so OAuth cookies match. */
export function devAuthRedirect(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') return null;

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
