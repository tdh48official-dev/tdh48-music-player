import {createClient} from '@/lib/supabase/server';
import {notFound} from 'next/navigation';
import type {Track} from '@/lib/types';
export const dynamic='force-dynamic';
function formatDuration(seconds:number|null|undefined){if(seconds==null||!Number.isFinite(seconds)||seconds<0)return '--:--';const total=Math.floor(seconds);return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;}
export default async function PublicPlaylistPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();
 const {data:playlist}=await supabase.from('playlists').select('id,title,description,cover_url,is_public,is_official').eq('id',id).maybeSingle();
 if(!playlist||!playlist.is_public)notFound();
 const {data}=await supabase.from('playlist_tracks').select('position,tracks(*)').eq('playlist_id',id).order('position');
 const tracks=(data||[]).map((x:any)=>x.tracks).filter(Boolean) as Track[];
 return <main className="mx-auto min-h-screen max-w-4xl px-5 py-10"><a href="/playlists" className="text-sm text-fuchsia-200">← เพลย์ลิสต์ทั้งหมด</a><div className="glass mt-6 rounded-3xl p-8"><p className="text-xs tracking-widest text-fuchsia-200">{playlist.is_official?'TDH48 OFFICIAL':'PUBLIC PLAYLIST'}</p><h1 className="mt-2 text-3xl font-black">{playlist.title}</h1><p className="mt-3 text-white/55">{playlist.description}</p><p className="mt-5 text-sm text-white/45">{tracks.length} เพลง</p></div><div className="mt-6 space-y-2">{tracks.map((t,i)=><div key={t.id} className="glass flex items-center gap-3 rounded-xl p-3"><img src={t.cover_url||'/cover-placeholder.svg'} alt="" className="h-12 w-12 rounded-lg object-cover"/><div><b className="text-sm">{i+1}. {t.title}</b><p className="text-xs text-white/45">{t.artist}</p></div><span className="ml-auto text-xs tabular-nums text-fuchsia-200/80">{formatDuration(t.duration_seconds)}</span></div>)}</div></main>
}
