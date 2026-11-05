-- Member accounts, favorites and playlists. Run after the existing schema.sql.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, track_id)
);
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.playlist_songs (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key(playlist_id, track_id)
);

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;

drop policy if exists "Profiles readable by owner" on public.profiles;
create policy "Profiles readable by owner" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Users read own favorites" on public.favorites;
create policy "Users read own favorites" on public.favorites for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users add own favorites" on public.favorites;
create policy "Users add own favorites" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users remove own favorites" on public.favorites;
create policy "Users remove own favorites" on public.favorites for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Read public or own playlists" on public.playlists;
create policy "Read public or own playlists" on public.playlists for select to anon, authenticated using (is_public = true or auth.uid() = user_id);
drop policy if exists "Users create own playlists" on public.playlists;
create policy "Users create own playlists" on public.playlists for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users update own playlists" on public.playlists;
create policy "Users update own playlists" on public.playlists for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users delete own playlists" on public.playlists;
create policy "Users delete own playlists" on public.playlists for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Read songs from visible playlists" on public.playlist_songs;
create policy "Read songs from visible playlists" on public.playlist_songs for select to anon, authenticated using (
  exists(select 1 from public.playlists p where p.id = playlist_id and (p.is_public = true or p.user_id = auth.uid()))
);
drop policy if exists "Owners manage playlist songs" on public.playlist_songs;
create policy "Owners manage playlist songs" on public.playlist_songs for insert to authenticated with check (
  exists(select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
);
drop policy if exists "Owners remove playlist songs" on public.playlist_songs;
create policy "Owners remove playlist songs" on public.playlist_songs for delete to authenticated using (
  exists(select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid())
);
