import {notFound} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import type {Track} from '@/lib/types';
import AlbumDetail from '@/components/AlbumDetail';
import {PlayerProvider} from '@/components/PlayerProvider';
import PlayerBar from '@/components/PlayerBar';
import SessionActivityGuard from '@/components/SessionActivityGuard';

export const dynamic='force-dynamic';

export default async function AlbumPage({params}:{params:Promise<{albumName:string}>}) {
  // Next.js supplies decoded route params; decodeURIComponent here would double-decode.
  const {albumName}=await params;
  const requestedAlbum=albumName.trim();
  if(!requestedAlbum) notFound();

  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError || !user) {
    return <main className="min-h-screen bg-[#fff7fb] p-8 text-center text-[#70485e]"><a href="/">กรุณาเข้าสู่ระบบเพื่อฟังเพลง</a></main>;
  }

  const {data,error}=await supabase
    .from('tracks')
    .select('*')
    .eq('published',true)
    .eq('album',requestedAlbum)
    .order('created_at',{ascending:true});

  if(error) {
    console.error('Album tracks query failed:',error.message);
    throw new Error('ไม่สามารถโหลดเพลงในอัลบั้มได้');
  }

  let tracks=(data??[]) as Track[];
  if(!tracks.length) {
    const fallback=await supabase
      .from('tracks')
      .select('*')
      .eq('published',true)
      .order('created_at',{ascending:true});
    if(fallback.error) {
      console.error('Album fallback query failed:',fallback.error.message);
      throw new Error('ไม่สามารถโหลดเพลงในอัลบั้มได้');
    }
    tracks=((fallback.data??[]) as Track[]).filter(track=>(track.album??'').trim()===requestedAlbum);
  }

  if(!tracks.length) notFound();

  // The root layout does not mount AppShell, so this route must provide its own player context.
  return (
    <SessionActivityGuard>
      <PlayerProvider>
        <AlbumDetail albumName={requestedAlbum} tracks={tracks}/>
        <PlayerBar/>
      </PlayerProvider>
    </SessionActivityGuard>
  );
}
