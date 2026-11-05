import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Keep public pages available if auth configuration is not present.
  if (!supabaseUrl || !supabaseKey) {
    if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
      return NextResponse.redirect(new URL('/admin/login?error=config', request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // Explicitly type the cookie updates so strict TypeScript builds pass.
      setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh/verify the cookie-backed session on every page request.
  // This keeps a member signed in while Supabase refresh tokens remain valid.
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  const isAdminLogin = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

  // The homepage handles member access by rendering MemberLogin when no session exists.
  // Admin pages retain their separate administrator-only check.
  if (pathname.startsWith('/admin') && !isAdminLogin) {
    if (claimsError || !claimsData?.claims?.sub) {
      return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url));
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', claimsData.claims.sub)
      .maybeSingle();

    if (profileError || !profile || profile.is_admin !== true) {
      return NextResponse.redirect(new URL('/admin/login?error=not-admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
