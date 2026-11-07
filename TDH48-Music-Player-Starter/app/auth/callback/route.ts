import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeNextPath(value: string | null) {
  // Only allow same-site relative paths; never redirect to an arbitrary host.
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNextPath(url.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // createClient persists the new Supabase session in the response cookies.
      return NextResponse.redirect(new URL(next, 'https://tdh48-music-player-official.vercel.app'));
    }
  }

  const errorUrl = new URL('/', 'https://tdh48-music-player-official.vercel.app');
  errorUrl.searchParams.set('auth', 'confirmation-error');
  return NextResponse.redirect(errorUrl);
}
