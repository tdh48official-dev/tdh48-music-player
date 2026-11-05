# TDH48 member accounts setup

## 1. Apply the database migration

In Supabase Dashboard → SQL Editor, run the existing `supabase/schema.sql` first if this is a fresh project, then run `supabase/member_accounts.sql`.

The migration adds `favorites`, `playlists`, and `playlist_songs`. Row Level Security is enabled. Favorites are owner-only; playlists are owner-managed and can be marked public; only public playlists and their songs can be read by other visitors.

## 2. Authentication providers

In Supabase Dashboard → Authentication → Providers:
- Enable Email. Configure email confirmation and SMTP according to your preference.
- Enable Google and enter the OAuth Client ID and Client Secret from Google Cloud Console.

Add these URLs to Authentication → URL Configuration → Redirect URLs:
- `https://tdh48-music-player-official.vercel.app/auth/callback`
- `https://*-tdh48official.vercel.app/auth/callback` (or add the exact Vercel preview hostname you use)

Set the Site URL to `https://tdh48-music-player-official.vercel.app`.

In Google Cloud Console, add the Supabase OAuth callback URL shown by Supabase as an Authorized redirect URI. Do not use the app callback URL in Google's provider console; Google redirects to Supabase first.

## 3. Vercel environment variables

The project already has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` configured for Production, Preview, and Development. Never expose a Supabase service-role key in a `NEXT_PUBLIC_*` variable or browser code.

## 4. Test

1. Create a test account with email/password and verify the email if confirmation is enabled.
2. Sign in with Google after enabling the provider.
3. Save and remove a favorite; sign out and sign in as another user to verify isolation.
4. Create both a private and public playlist. Confirm a second account cannot see the private playlist.
