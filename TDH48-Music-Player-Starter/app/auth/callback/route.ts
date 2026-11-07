import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

function safeNextPath(value: string | null) {
  // Only allow same-site relative paths; never redirect to an arbitrary host.
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));
  const destination = new URL(next, 'https://tdh48-music-player-official.vercel.app');
  const response = NextResponse.redirect(destination);

  if (!code) {
    const errorUrl = new URL('/', 'https://tdh48-music-player-official.vercel.app');
    errorUrl.searchParams.set('auth', 'confirmation-error');
    return NextResponse.redirect(errorUrl);
  }

  // Attach Supabase's refreshed session cookies to the exact redirect response.
  // This ensures the browser receives the session created by the PKCE exchange.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (!error) return response;

  console.error('Supabase auth callback exchange failed:', error.message);
  const errorUrl = new URL('/', 'https://tdh48-music-player-official.vercel.app');
  errorUrl.searchParams.set('auth', 'confirmation-error');
  return NextResponse.redirect(errorUrl);
}
