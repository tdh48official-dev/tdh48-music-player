import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Track } from '@/lib/types';
import FavoriteSongs from '@/components/FavoriteSongs';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');
  const { data: favorites, error: favoritesError } = await supabase
    .from('favorites').select('track_id,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
  if (favoritesError) console.error('Could not load favorite tracks:', favoritesError.message);
  const ids = (favorites || []).map(row => row.track_id);
  let tracks: Track[] = [];
  if (ids.length) {
    const { data, error } = await supabase.from('tracks').select('*').eq('published', true).in('id', ids);
    if (error) console.error('Could not load favorite track details:', error.message);
    const byId = new Map((data || []).map(row => [row.id, row as Track]));
    tracks = ids.map(id => byId.get(id)).filter((song): song is Track => Boolean(song));
  }
  return <FavoriteSongs tracks={tracks}/>;
}
