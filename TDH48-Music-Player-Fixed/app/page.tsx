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

  // The member login is the public landing page. Only authenticated members
  // can continue to the music library.
  if (!user) {
    return <MemberLogin />;
  }

  let tracks: Track[] = [];
  try {
    const { data } = await supabase
      .from('tracks')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    tracks = (data ?? []) as Track[];
  } catch {
    tracks = [];
  }

  return (
    <PlayerProvider>
      <MusicApp initialTracks={tracks} />
      <PlayerBar />
    </PlayerProvider>
  );
}
