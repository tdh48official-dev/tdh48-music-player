'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  ArrowLeft,
  Disc3,
  Headphones,
  Music2,
  Play,
  Search,
  ShieldCheck,
} from 'lucide-react';

import type { Track } from '@/lib/types';
import { usePlayer } from './PlayerProvider';

export default function MusicApp({
  initialTracks,
}: {
  initialTracks: Track[];
}) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const { play, track, playing, setQueue } = usePlayer();

  const cats = [
    'ทั้งหมด',
    'Single',
    'Album',
    'Cover',
    'Live',
    'Original',
  ];

  useEffect(() => {
    setQueue(initialTracks);
  }, [initialTracks, setQueue]);

  const tracks = useMemo(() => {
    return initialTracks.filter((t) => {
      const matchesCategory =
        category === 'ทั้งหมด' || t.category === category;

      const matchesSearch =
        `${t.title} ${t.artist} ${t.album || ''}`
          .toLowerCase()
          .includes(q.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [initialTracks, q, category]);

  const featured =
    initialTracks.find((t) => t.is_featured) || initialTracks[0];

  const detailTracks = useMemo(() => {
    if (!selectedTrack) return [];

    if (selectedTrack.album) {
      return initialTracks.filter(
        (t) =>
          t.album === selectedTrack.album &&
          t.artist === selectedTrack.artist
      );
    }

    return [selectedTrack];
  }, [selectedTrack, initialTracks]);

  const openTrack = (item: Track) => {
    setSelectedTrack(item);
  };

  const playTrack = (item: Track, list = initialTracks) => {
    setQueue(list);
    play(item);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <main className="min-h-screen bg-[#090909] pb-36 text-white">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#090909]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-7">

          <a href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white text-black">
              <Music2 size={22} />
            </div>

            <div>
              <div className="font-black tracking-[.15em]">
                TDH48
              </div>

              <div className="text-[9px] tracking-[.3em] text-white/40">
                MUSIC PLAYER
              </div>
            </div>
          </a>

          <div className="hidden max-w-md flex-1 items-center gap-3 rounded-full bg-white/10 px-5 py-3 md:flex">
            <Search size={18} className="text-white/50" />

            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSelectedTrack(null);
              }}
              placeholder="ค้นหาเพลงหรือศิลปิน..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>

          <a
            href="/admin/login"
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:bg-white/10"
          >
            <ShieldCheck size={15} />
            Admin
          </a>

        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-7">

        {/* หน้าเพลงที่เลือก */}
        {selectedTrack ? (

          <section>

            <button
              onClick={() => setSelectedTrack(null)}
              className="mb-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/20"
            >
              <ArrowLeft size={18} />
              ย้อนกลับ
            </button>

            {/* Album Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#5a536a] to-[#202027] p-5 md:p-10">

              <div className="relative z-10 flex flex-col items-center gap-7 md:flex-row md:items-end">

                <img
                  src={selectedTrack.cover_url || '/cover-placeholder.svg'}
                  alt={selectedTrack.title}
                  className="aspect-square w-56 rounded-xl object-cover shadow-2xl md:w-72"
                />

                <div className="min-w-0 flex-1 text-center md:text-left">

                  <div className="mb-3 text-sm font-semibold">
                    {selectedTrack.album ? 'อัลบั้ม' : 'ซิงเกิล'}
                  </div>

                  <h1 className="break-words text-3xl font-black md:text-6xl">
                    {selectedTrack.album || selectedTrack.title}
                  </h1>

                  <div className="mt-5 text-sm text-white/70">
                    <span className="font-semibold text-white">
                      {selectedTrack.artist}
                    </span>

                    {selectedTrack.album && (
                      <span> · {selectedTrack.title}</span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    {selectedTrack.category}
                    {selectedTrack.release_date &&
                      ` · ${formatDate(selectedTrack.release_date)}`}
                    {` · ${detailTracks.length} เพลง`}
                  </div>

                </div>
              </div>

            </div>

            {/* Detail Controls */}
            <div className="my-7 flex items-center gap-5">

              <button
                onClick={() => playTrack(selectedTrack, detailTracks)}
                className="grid h-16 w-16 place-items-center rounded-full bg-[#1ed760] text-black transition hover:scale-105 hover:bg-[#35ed79]"
                aria-label="เล่นเพลง"
              >
                <Play size={29} fill="currentColor" />
              </button>

              <div>
                <div className="text-sm font-bold">
                  รายการเพลง
                </div>

                <div className="text-xs text-white/40">
                  TDH48 Music Library
                </div>
              </div>

            </div>

            {/* Track List */}
            <div className="border-b border-white/10 pb-3 text-xs text-white/40">
              <div className="grid grid-cols-[35px_1fr_55px] px-4">
                <span>#</span>
                <span>ชื่อเพลง</span>
                <span className="text-right">เวลา</span>
              </div>
            </div>

            <div className="mt-2 space-y-1">

              {detailTracks.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => playTrack(item, detailTracks)}
                  className={`grid w-full grid-cols-[35px_1fr_55px] items-center rounded-xl px-4 py-4 text-left transition hover:bg-white/10 ${
                    track?.id === item.id ? 'bg-white/10' : ''
                  }`}
                >
                  <span className="text-sm text-white/40">
                    {track?.id === item.id && playing
                      ? '♫'
                      : index + 1}
                  </span>

                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.title}
                    </span>

                    <span className="block truncate text-xs text-white/45">
                      {item.artist}
                    </span>
                  </span>

                  <span className="text-right text-xs text-white/40">
                    {item.duration_seconds
                      ? `${Math.floor(item.duration_seconds / 60)}:${String(
                          item.duration_seconds % 60
                        ).padStart(2, '0')}`
                      : '--:--'}
                  </span>
                </button>
              ))}

            </div>

          </section>

        ) : (

          <>
            {/* Featured Song */}
            {featured && (
              <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#45374f] to-[#16131c]">

                <div className="absolute inset-0">
                  <img
                    src={featured.cover_url || '/cover-placeholder.svg'}
                    alt=""
                    className="h-full w-full object-cover opacity-20 blur-2xl"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />
                </div>

                <div className="relative flex flex-col items-center gap-7 p-6 md:flex-row md:p-12">

                  <img
                    src={featured.cover_url || '/cover-placeholder.svg'}
                    alt={featured.title}
                    className="aspect-square w-52 rounded-2xl object-cover shadow-2xl md:w-72"
                  />

                  <div className="flex-1 text-center md:text-left">

                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
                      <Headphones size={14} />
                      TDH48 FEATURED MUSIC
                    </div>

                    <div className="text-sm text-white/60">
                      เพลงแนะนำ
                    </div>

                    <h1 className="mt-2 break-words text-3xl font-black md:text-6xl">
                      {featured.title}
                    </h1>

                    <div className="mt-3 text-sm text-white/70">
                      {featured.artist}
                    </div>

                    <div className="mt-2 text-xs text-white/45">
                      {featured.category}
                      {featured.album ? ` · ${featured.album}` : ''}
                    </div>

                    <div className="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">

                      <button
                        onClick={() => playTrack(featured)}
                        className="flex items-center gap-3 rounded-full bg-[#1ed760] px-7 py-3 font-bold text-black transition hover:scale-105"
                      >
                        <Play size={18} fill="currentColor" />
                        เล่นเพลง
                      </button>

                      <button
                        onClick={() => openTrack(featured)}
                        className="rounded-full border border-white/30 px-6 py-3 text-sm transition hover:bg-white/10"
                      >
                        ดูรายละเอียด
                      </button>

                    </div>

                  </div>

                </div>
              </section>
            )}

            {/* Discover */}
            <section>

              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">

                <div>
                  <div className="text-xs font-bold tracking-[.25em] text-fuchsia-300">
                    DISCOVER
                  </div>

                  <h2 className="mt-2 text-2xl font-black md:text-3xl">
                    คลังเพลง TDH48
                  </h2>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 md:hidden">
                  <Search size={17} className="text-white/50" />

                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ค้นหาเพลง..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>

              </div>

              {/* Categories */}
              <div className="mb-7 flex gap-2 overflow-x-auto pb-2">

                {cats.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`whitespace-nowrap rounded-full px-5 py-2.5 text-xs transition ${
                      category === c
                        ? 'bg-white font-bold text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {c}
                  </button>
                ))}

              </div>

              {/* Music Cards */}
              {tracks.length === 0 ? (

                <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">

                  <Disc3
                    size={40}
                    className="mx-auto mb-4 text-white/40"
                  />

                  <h3 className="font-bold">
                    ยังไม่มีเพลงในหมวดนี้
                  </h3>

                  <p className="mt-2 text-sm text-white/40">
                    ลองเลือกหมวดอื่นหรือค้นหาเพลงใหม่
                  </p>

                </div>

              ) : (

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

                  {tracks.map((item) => (

                    <div
                      key={item.id}
                      className="group min-w-0 rounded-2xl bg-white/[0.04] p-3 transition hover:bg-white/[0.10]"
                    >

                      <button
                        onClick={() => openTrack(item)}
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-white/10">

                          <img
                            src={item.cover_url || '/cover-placeholder.svg'}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          <div className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-[#1ed760] text-black opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
                            <Play size={19} fill="currentColor" />
                          </div>

                        </div>

                        <div className="mt-4 truncate text-sm font-bold">
                          {item.title}
                        </div>

                        <div className="mt-1 truncate text-xs text-white/45">
                          {item.artist}
                        </div>

                        <div className="mt-2 truncate text-[10px] text-white/35">
                          {item.category}
                        </div>
                      </button>

                      <button
                        onClick={() => playTrack(item)}
                        className="mt-3 w-full rounded-full border border-white/10 py-2 text-xs text-white/70 transition hover:bg-white/10"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Play size={12} fill="currentColor" />
                          เล่นเพลง
                        </span>
                      </button>

                    </div>

                  ))}

                </div>

              )}

            </section>
          </>
        )}

      </div>

      <footer className="mx-auto mt-16 max-w-[1600px] px-5 text-center text-xs text-white/30">
        © {new Date().getFullYear()} TDH48 MUSIC · Made for the fans
      </footer>

    </main>
  );
}
