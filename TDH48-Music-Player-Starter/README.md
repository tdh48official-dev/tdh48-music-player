# TDH48 Music Player

A deployable starter for a public TDH48 music streaming website with a protected admin dashboard.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth (admin login)
- Supabase Postgres (tracks, albums, categories)
- Supabase Storage (audio files and cover art)
- Tailwind CSS

## Features included
- Public home page, search, category filters, track listing
- Persistent bottom audio player (HTML audio)
- Admin login and protected dashboard
- Add/edit/delete tracks
- Upload audio and cover images to Supabase Storage
- SQL schema, RLS policies, and admin role setup

## 1. Create Supabase project
Create a project at https://supabase.com, then open SQL Editor and run `supabase/schema.sql`.

In Supabase Storage, the SQL script creates two public buckets:
- `tdh48-audio`
- `tdh48-covers`

Audio and cover files are publicly readable. Only authenticated users with `profiles.is_admin = true` can upload, update, or delete.

## 2. Configure environment
Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.

## 3. Create an admin
1. In Supabase Authentication, create an account for the admin.
2. Copy that user's UUID.
3. In SQL Editor, run:
   `update public.profiles set is_admin = true where id = 'YOUR-USER-UUID';`
   A profile row is automatically created when a user signs up.

## 4. Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## 5. Deploy
Push this folder to a Git repository and import it into Vercel. Add the same environment variables in Vercel.

## Important
This is a working application starter, not a hosted/live website. You must connect a Supabase project and deploy it before people can stream music online. Upload only audio and artwork that TDH48 owns or is authorized to distribute.
