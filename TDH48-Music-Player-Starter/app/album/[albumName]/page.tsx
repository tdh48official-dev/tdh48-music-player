import {notFound} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import type {Track} from '@/lib/types';
import AlbumDetail from '@/components/AlbumDetail';

export const dynamic='force-dynamic';

export default async function AlbumPage({params}:{params:Promise<{albumName:string}>}) {
  // Next.js already decodes dynamic route params; do not decode a second time.
  const {albumName}=await params;
  const requestedAlbum=albumName.trim();
  if(!requestedAlbum) notFound();

  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) {
    return <main className="min-h-screen bg-[#fff7fb] p-8 text-center text-[#70485e]"><a href="/">กรุณาเข้าสู่ระบบเพื่อฟังเพลง</a></main>;
  }

  // Match the same trimmed album names used by the album cards on the home page.
  // The fallback also handles older records whose album field contains extra spaces.
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
  return <AlbumDetail albumName={requestedAlbum} tracks={tracks}/>;
}
