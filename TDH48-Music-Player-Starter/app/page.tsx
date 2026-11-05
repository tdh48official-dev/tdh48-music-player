import { PlayerProvider } from '@/components/PlayerProvider';
import PlayerBar from '@/components/PlayerBar';
import MusicApp from '@/components/MusicApp';
import MemberLogin from '@/components/MemberLogin';
import { createClient } from '@/lib/supabase/server';
import type { Track } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Show the email-only member login before exposing the music library.
  if (!user) {
    return <MemberLogin />;
  }

  let tracks: Track[] = [];
  let playCounts: { track_id: string; play_count: number }[] = [];

  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Home tracks fetch error:', error.message);
    } else {
      tracks = (data ?? []) as Track[];
    }

    const { data: counts, error: countsError } = await supabase
      .from('track_play_counts')
      .select('track_id, play_count');

    if (countsError) {
      console.error('Home play counts fetch error:', countsError.message);
    } else {
      playCounts = (counts ?? []).map((row) => ({
        track_id: row.track_id as string,
        play_count: Number(row.play_count) || 0,
      }));
    }
  } catch (error) {
    console.error('Home Supabase error:', error);
  }

  return (
    <PlayerProvider>
      <MusicApp initialTracks={tracks} initialPlayCounts={playCounts} />
      <PlayerBar />
    </PlayerProvider>
  );
}
