create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin insert into public.profiles(id) values(new.id) on conflict(id) do nothing; return new; end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default 'TDH48',
  category text not null default 'Single' check(category in ('Single','Album','Cover','Live','Original')),
  album text,
  audio_url text not null,
  cover_url text,
  duration_seconds integer,
  release_date date,
  is_featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tracks enable row level security;

create policy "Profiles readable by owner" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Public can read published tracks" on public.tracks for select to anon, authenticated using (published = true or exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));
create policy "Admins can insert tracks" on public.tracks for insert to authenticated with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));
create policy "Admins can update tracks" on public.tracks for update to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin)) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));
create policy "Admins can delete tracks" on public.tracks for delete to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
 ('tdh48-audio','tdh48-audio',true,524288000,array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/aac','audio/flac','audio/ogg']),
 ('tdh48-covers','tdh48-covers',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true;

create policy "Public can read TDH48 media" on storage.objects for select to anon, authenticated using(bucket_id in ('tdh48-audio','tdh48-covers'));
create policy "Admins can upload TDH48 media" on storage.objects for insert to authenticated with check(bucket_id in ('tdh48-audio','tdh48-covers') and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));
create policy "Admins can update TDH48 media" on storage.objects for update to authenticated using(bucket_id in ('tdh48-audio','tdh48-covers') and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));
create policy "Admins can delete TDH48 media" on storage.objects for delete to authenticated using(bucket_id in ('tdh48-audio','tdh48-covers') and exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_admin));
