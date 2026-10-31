
import { PlayerProvider } from '@/components/PlayerProvider';
import PlayerBar from '@/components/PlayerBar';
import MusicApp from '@/components/MusicApp';
import { createClient } from '@/lib/supabase/server';
import type { Track } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  let tracks: Track[] = [];

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Home tracks fetch error:', error.message);
    } else {
      tracks = (data ?? []) as Track[];
      console.log('Home tracks loaded:', tracks.length);
    }
  } catch (error) {
    console.error('Home Supabase error:', error);
  }

  return (
    <PlayerProvider>
      <MusicApp initialTracks={tracks} />
      <PlayerBar />
    </PlayerProvider>
  );
}
