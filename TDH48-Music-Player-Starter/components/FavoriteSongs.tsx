'use client';

import Link from 'next/link';
import { ArrowLeft, AudioLines, Heart, Play } from 'lucide-react';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/components/PlayerProvider';
import { useFavorites } from '@/components/useFavorites';

export default function FavoriteSongs({ tracks }: { tracks: Track[] }) {
  const { track, playing, play, setQueue } = usePlayer();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const likedTracks = favoriteIds.length
    ? favoriteIds.map(id => tracks.find(song => song.id === id)).filter((song): song is Track => Boolean(song))
    : tracks;

  const playAll = () => {
    if (!likedTracks.length) return;
    setQueue(likedTracks);
    play(likedTracks[0]);
  };

  return (
    <main className="min-h-screen bg-[#fff7fb] px-4 pb-40 pt-5 text-[#654458] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f0d5e2] bg-white px-4 py-2 text-sm font-semibold text-[#a45d80] shadow-sm"><ArrowLeft size={17}/> กลับหน้าแรก</Link>
        <header className="mb-6 flex items-end justify-between gap-4 rounded-[26px] border border-[#f0d5e2] bg-gradient-to-br from-[#ffe4ef] to-white p-5 shadow-sm sm:p-7">
          <div><p className="text-[10px] font-bold tracking-[.2em] text-[#c58ca7]">YOUR FAVORITES</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">เพลงที่ถูกใจ</h1><p className="mt-2 text-sm text-[#a98b9b]">{likedTracks.length} เพลงที่บันทึกไว้</p></div>
          <button onClick={playAll} disabled={!likedTracks.length} aria-label="เล่นเพลงที่ถูกใจทั้งหมด" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#d979a2] text-white shadow-md transition hover:bg-[#c96591] disabled:opacity-40"><Play size={22} fill="currentColor"/></button>
        </header>
        {likedTracks.length ? (
          <section className="overflow-hidden rounded-2xl border border-[#f0d5e2] bg-white shadow-sm">
            {likedTracks.map((song, index) => (
              <div key={song.id} className={`flex items-center gap-3 border-b border-[#f7e8ef] px-3 py-3 last:border-0 sm:gap-4 sm:px-4 ${track?.id === song.id ? 'bg-[#fff0f6]' : 'hover:bg-[#fff9fc]'}`}>
                <button onClick={() => { setQueue(likedTracks); play(song); }} aria-label={`เล่น ${song.title}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#fff0f6] sm:h-14 sm:w-14">
                  <img src={song.cover_url || '/cover-placeholder.svg'} alt={`ปกเพลง ${song.title}`} className="h-full w-full object-cover"/>
                  {track?.id === song.id && playing && <span className="absolute inset-0 grid place-items-center bg-black/35 text-white"><AudioLines size={18}/></span>}
                </button>
                <button onClick={() => { setQueue(likedTracks); play(song); }} className="min-w-0 flex-1 text-left">
                  <b className="block truncate text-sm font-semibold text-[#70485e]">{song.title}</b>
                  <span className="block truncate text-xs text-[#a98b9b]">{song.artist}</span>
                </button>
                <span className="hidden text-xs tabular-nums text-[#a98b9b] sm:block">{song.duration_seconds ? `${Math.floor(song.duration_seconds/60)}:${String(song.duration_seconds%60).padStart(2,'0')}` : ''}</span>
                <button onClick={() => toggleFavorite(song.id)} aria-label={`นำ ${song.title} ออกจากเพลงที่ถูกใจ`} title="นำออกจากเพลงที่ถูกใจ" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#cf6796] hover:bg-[#fff0f6]"><Heart size={19} fill="currentColor"/></button>
              </div>
            ))}
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#efd5e1] bg-white/70 px-4 py-16 text-center"><Heart size={28} className="mx-auto text-[#d78aaa]"/><p className="mt-3 font-semibold text-[#70485e]">ยังไม่มีเพลงที่ถูกใจ</p><p className="mt-1 text-sm text-[#a98b9b]">กดหัวใจในแถบ Now Playing เพื่อบันทึกเพลงไว้ที่นี่</p></div>
        )}
      </div>
    </main>
  );
}
