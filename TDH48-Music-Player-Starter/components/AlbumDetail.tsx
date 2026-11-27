'use client';
import {useMemo} from 'react';
import Link from 'next/link';
import {ArrowLeft,Play,Pause,Shuffle,AudioLines} from 'lucide-react';
import type {Track} from '@/lib/types';
import {usePlayer} from '@/components/PlayerProvider';
const fmt=(n:number)=>!Number.isFinite(n)||n<=0?'0:00':`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
export default function AlbumDetail({albumName,tracks}:{albumName:string;tracks:Track[]}) {
 const {track,playing,play,toggle,setQueue}=usePlayer();
 const artist=useMemo(()=>[...new Set(tracks.map(t=>t.artist).filter(Boolean))].join(' • '),[tracks]);
 const cover=tracks.find(t=>t.cover_url)?.cover_url||'/cover-placeholder.svg';
 const playAlbum=()=>{setQueue(tracks);play(tracks[0]);};
 return <main className="min-h-screen bg-[#fff7fb] px-4 pb-40 pt-5 text-[#654458] sm:px-8">
  <div className="mx-auto max-w-5xl">
   <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f0d5e2] bg-white px-4 py-2 text-sm font-semibold text-[#a45d80] shadow-sm"><ArrowLeft size={17}/> กลับหน้าแรก</Link>
   <section className="relative overflow-hidden rounded-[28px] border border-[#f0d5e2] bg-white shadow-sm">
    <div className="absolute inset-0 opacity-20 blur-3xl" style={{backgroundImage:`url("${cover}")`,backgroundSize:'cover',backgroundPosition:'center'}}/>
    <div className="relative flex flex-col gap-6 bg-gradient-to-b from-[#ffe6f0]/90 to-white/95 p-5 sm:flex-row sm:items-end sm:p-8">
     <img src={cover} alt={`ปกอัลบั้ม ${albumName}`} className="aspect-square w-44 rounded-2xl border border-white object-cover shadow-xl sm:w-60"/>
     <div className="min-w-0 pb-1"><p className="text-xs font-bold tracking-[.22em] text-[#bf7e9e]">ALBUM</p><h1 className="mt-2 break-words text-3xl font-black text-[#70485e] sm:text-5xl">{albumName}</h1><p className="mt-3 text-sm font-semibold text-[#94657d]">{artist}</p><p className="mt-1 text-xs text-[#b58ca0]">{tracks.length} เพลง</p></div>
    </div>
    <div className="relative flex items-center gap-3 border-t border-[#f5e4eb] bg-white/90 px-5 py-4 sm:px-8">
     <button onClick={playAlbum} disabled={!tracks.length} className="flex items-center gap-2 rounded-full bg-[#d979a2] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#c96591] disabled:opacity-50"><Play size={18} fill="currentColor"/> เล่นอัลบั้ม</button>
     <button onClick={()=>{setQueue(tracks);const shuffled=[...tracks].sort(()=>Math.random()-.5);play(shuffled[0]);}} className="grid h-11 w-11 place-items-center rounded-full border border-[#f0d5e2] text-[#b76d91]" aria-label="สุ่มเล่น"><Shuffle size={19}/></button>
    </div>
   </section>
   <section className="mt-7 overflow-hidden rounded-2xl border border-[#f0d5e2] bg-white shadow-sm">
    <div className="grid grid-cols-[36px_minmax(0,1fr)_55px] gap-3 border-b border-[#f5e4eb] px-4 py-3 text-[10px] font-bold tracking-widest text-[#c08aa4]"><span>#</span><span>ชื่อเพลง</span><span className="text-right">เวลา</span></div>
    {tracks.map((song,index)=><button key={song.id} onClick={()=>{setQueue(tracks);play(song);}} className={`grid w-full grid-cols-[36px_minmax(0,1fr)_55px] items-center gap-3 border-b border-[#f8edf2] px-4 py-3 text-left last:border-0 hover:bg-[#fff5f9] ${track?.id===song.id?'bg-[#fff0f6]':''}`}>
      <span className="grid place-items-center text-xs tabular-nums text-[#bd91a7]">{track?.id===song.id&&playing?<AudioLines size={16} className="text-[#c06d94]"/>:index+1}</span>
      <span className="min-w-0"><b className="block truncate text-sm font-semibold text-[#70485e]">{song.title}</b><span className="block truncate text-xs text-[#a98b9b]">{song.artist}</span></span>
      <span className="text-right text-xs tabular-nums text-[#a98b9b]">{fmt(song.duration_seconds||0)}</span>
    </button>)}
   </section>
  </div>
 </main>;
}
