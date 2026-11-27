import {notFound} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import type {Track} from '@/lib/types';
import AlbumDetail from '@/components/AlbumDetail';
export const dynamic='force-dynamic';
export default async function AlbumPage({params}:{params:Promise<{albumName:string}>}) {
 const {albumName:raw}=await params;
 const albumName=decodeURIComponent(raw);
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) return <main className="min-h-screen bg-[#fff7fb] p-8 text-center text-[#70485e]"><a href="/">กรุณาเข้าสู่ระบบเพื่อฟังเพลง</a></main>;
 const {data,error}=await supabase.from('tracks').select('*').eq('published',true).eq('album',albumName).order('created_at',{ascending:true});
 if(error||!data?.length) notFound();
 return <AlbumDetail albumName={albumName} tracks={data as Track[]}/>;
}
