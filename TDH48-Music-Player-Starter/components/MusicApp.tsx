
'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Headphones,
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
  const [featuredIndex, setFeaturedIndex] = useState(0);

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

  // เพลงที่แอดมินเลือกให้เป็นเพลงแนะนำ
  const featuredTracks = useMemo(
    () => initialTracks.filter((t) => t.is_featured),
    [initialTracks]
  );

  const featured = featuredTracks[featuredIndex] || null;

  // เปลี่ยนสไลด์อัตโนมัติทุก 5 วินาที
  useEffect(() => {
    if (featuredTracks.length <= 1) {
      setFeaturedIndex(0);
      return;
    }

    const timer = window.setInterval(() => {
      setFeaturedIndex(
        (current) => (current + 1) % featuredTracks.length
      );
    }, 5000);

    return () => window.clearInterval(timer);
  }, [featuredTracks.length]);

  // ป้องกัน index เกินเมื่อมีการเพิ่มหรือลบเพลงแนะนำ
  useEffect(() => {
    setFeaturedIndex((current) =>
      featuredTracks.length === 0
        ? 0
        : current % featuredTracks.length
    );
  }, [featuredTracks.length]);

  const nextFeatured = () => {
    if (featuredTracks.length <= 1) return;

    setFeaturedIndex(
      (current) => (current + 1) % featuredTracks.length
    );
  };

  const previousFeatured = () => {
    if (featuredTracks.length <= 1) return;

    setFeaturedIndex(
      (current) =>
        (current - 1 + featuredTracks.length) %
        featuredTracks.length
    );
  };

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

  // เล่นเพลงได้ทันทีโดยไม่ต้องเปิดป็อปอัพ
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
      <header className="sticky top-0 z-20 border-b border-pink-400/10 bg-[#090909]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-7">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/tdh48-logo.png"
              alt="TDH48 Logo"
              className="h-12 w-12 shrink-0 rounded-full border-2 border-pink-400/70 object-cover shadow-lg shadow-pink-500/20"
            />

            <div>
              <div className="font-black tracking-[.15em] text-pink-100">
                TDH48
              </div>

              <div className="text-[9px] tracking-[.3em] text-pink-300/60">
                MUSIC PLAYER
              </div>
            </div>
          </a>

          {/* Search Desktop */}
          <div className="hidden max-w-md flex-1 items-center gap-3 rounded-full border border-pink-300/10 bg-white/5 px-5 py-3 md:flex">
            <Search size={18} className="text-pink-300/60" />

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

          <div className="flex items-center gap-2">
            <a
              href="/playlists"
              className="rounded-full border border-pink-300/20 px-4 py-2 text-xs text-pink-100/80 transition hover:bg-pink-400/10"
            >
              เพลย์ลิสต์
            </a>

            {/* Admin */}
            <a
              href="/admin/login"
              className="flex items-center gap-2 rounded-full border border-pink-300/20 px-4 py-2 text-xs text-pink-100/80 transition hover:border-pink-300/50 hover:bg-pink-400/10 hover:text-pink-200"
            >
              <ShieldCheck size={15} />
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-7">
        {/* หน้ารายละเอียดเพลง */}
        {selectedTrack ? (
          <section>
            <button
              onClick={() => setSelectedTrack(null)}
              className="mb-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-pink-400/20 hover:text-pink-200"
            >
              <ArrowLeft size={18} />
              ย้อนกลับ
            </button>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#6b354f] to-[#20121c] p-5 md:p-10">
              <div className="relative z-10 flex flex-col items-center gap-7 md:flex-row md:items-end">
                <img
                  src={
                    selectedTrack.cover_url ||
                    '/cover-placeholder.svg'
                  }
                  alt={selectedTrack.title}
                  className="aspect-square w-56 rounded-xl object-cover shadow-2xl md:w-72"
                />

                <div className="min-w-0 flex-1 text-center md:text-left">
                  <div className="mb-3 text-sm font-semibold text-pink-200">
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

            {/* ปุ่มเล่นอัลบั้ม */}
            <div className="my-7 flex items-center gap-5">
              <button
                onClick={() => playTrack(selectedTrack, detailTracks)}
                className="grid h-16 w-16 place-items-center rounded-full bg-pink-400 text-[#260d1b] shadow-xl shadow-pink-500/25 transition hover:scale-110 hover:bg-pink-300 active:scale-95"
                aria-label="เล่นเพลง"
              >
                <Play size={29} fill="currentColor" />
              </button>

              <div>
                <div className="text-sm font-bold">
                  รายการเพลง
                </div>

                <div className="text-xs text-pink-200/40">
                  TDH48 Music Library
                </div>
              </div>
            </div>

            {/* รายการเพลง */}
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
                  className={`grid w-full grid-cols-[35px_1fr_55px] items-center rounded-xl px-4 py-4 text-left transition hover:bg-pink-400/10 ${
                    track?.id === item.id ? 'bg-pink-400/10' : ''
                  }`}
                >
                  <span className="text-sm text-pink-300">
                    {track?.id === item.id && playing
                      ? '♫'
                      : index + 1}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block truncate text-sm font-semibold ${
                        track?.id === item.id
                          ? 'text-pink-300'
                          : 'text-white'
                      }`}
                    >
                      {item.title}
                    </span>

                    <span className="block truncate text-xs text-white/45">
                      {item.artist}
                    </span>
                  </span>

                  <span className="text-right text-xs text-white/40">
                    {item.duration_seconds
                      ? `${Math.floor(
                          item.duration_seconds / 60
                        )}:${String(
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
            {/* Featured Music Slider */}
            {featured && (
              <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#51263e] to-[#161016]">
                <div className="absolute inset-0">
                  <img
                    key={`background-${featured.id}`}
                    src={
                      featured.cover_url ||
                      '/cover-placeholder.svg'
                    }
                    alt=""
                    className="h-full w-full object-cover opacity-20 blur-2xl"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />
                </div>

                <div className="relative flex min-h-[360px] flex-col items-center gap-7 p-6 md:min-h-[390px] md:flex-row md:p-12">
                  <img
                    key={featured.id}
                    src={
                      featured.cover_url ||
                      '/cover-placeholder.svg'
                    }
                    alt={featured.title}
                    className="aspect-square w-52 rounded-2xl object-cover shadow-2xl md:w-72"
                  />

                  <div className="min-w-0 flex-1 text-center md:text-left">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-400/10 px-3 py-1 text-xs text-pink-200">
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
                        className="flex items-center gap-3 rounded-full bg-pink-400 px-7 py-3 font-bold text-[#260d1b] shadow-lg shadow-pink-500/20 transition hover:scale-105 hover:bg-pink-300 active:scale-95"
                      >
                        <Play size={18} fill="currentColor" />
                        เล่นเพลง
                      </button>

                      <button
                        onClick={() => openTrack(featured)}
                        className="rounded-full border border-pink-200/30 px-6 py-3 text-sm transition hover:border-pink-300/60 hover:bg-pink-400/10"
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>

                  {/* ปุ่มเลื่อนสไลด์ */}
                  {featuredTracks.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={previousFeatured}
                        aria-label="เพลงแนะนำก่อนหน้า"
                        className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-pink-400 hover:text-black md:left-5"
                      >
                        <ChevronLeft size={22} />
                      </button>

                      <button
                        type="button"
                        onClick={nextFeatured}
                        aria-label="เพลงแนะนำถัดไป"
                        className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-pink-400 hover:text-black md:right-5"
                      >
                        <ChevronRight size={22} />
                      </button>
                    </>
                  )}

                  {/* จุดแสดงตำแหน่งสไลด์ */}
                  {featuredTracks.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
                      {featuredTracks.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFeaturedIndex(index)}
                          aria-label={`ไปเพลงแนะนำลำดับที่ ${index + 1}`}
                          className={`h-2 rounded-full transition-all ${
                            index === featuredIndex
                              ? 'w-7 bg-pink-300'
                              : 'w-2 bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Discover */}
            <section>
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="text-xs font-bold tracking-[.25em] text-pink-300">
                    DISCOVER
                  </div>

                  <h2 className="mt-2 text-2xl font-black md:text-3xl">
                    คลังเพลง TDH48
                  </h2>
                </div>

                {/* Search Mobile */}
                <div className="flex items-center gap-2 rounded-full border border-pink-300/10 bg-white/5 px-4 py-3 md:hidden">
                  <Search size={17} className="text-pink-300/60" />

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
                        ? 'bg-pink-400 font-bold text-[#260d1b] shadow-lg shadow-pink-500/20'
                        : 'bg-white/10 text-white/70 hover:bg-pink-400/15 hover:text-pink-200'
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
                    className="mx-auto mb-4 text-pink-300/50"
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
                      className="group min-w-0 rounded-2xl bg-white/[0.04] p-3 transition hover:bg-pink-400/[0.08]"
                    >
                      <button
                        onClick={() => openTrack(item)}
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-white/10">
                          <img
                            src={
                              item.cover_url ||
                              '/cover-placeholder.svg'
                            }
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />

                          <div className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-pink-400 text-[#260d1b] opacity-0 shadow-xl shadow-pink-500/30 transition group-hover:translate-y-0 group-hover:opacity-100">
                            <Play size={19} fill="currentColor" />
                          </div>
                        </div>

                        <div className="mt-4 truncate text-sm font-bold">
                          {item.title}
                        </div>

                        <div className="mt-1 truncate text-xs text-white/45">
                          {item.artist}
                        </div>

                        <div className="mt-2 truncate text-[10px] text-pink-200/40">
                          {item.category}
                        </div>
                      </button>

                      <button
                        onClick={() => playTrack(item)}
                        className="mt-3 w-full rounded-full border border-pink-300/20 py-2 text-xs text-pink-200/80 transition hover:border-pink-300/50 hover:bg-pink-400/15 hover:text-pink-100"
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

      <footer className="mx-auto mt-16 max-w-[1600px] px-5 text-center text-xs text-pink-200/30">
        © {new Date().getFullYear()} TDH48 MUSIC · Made for the fans
      </footer>
    </main>
  );
}
