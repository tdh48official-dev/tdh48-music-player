
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Captions,
} from 'lucide-react';

import { usePlayer } from './PlayerProvider';

type TimedLyric = { time: number; text: string };

function parseLyrics(value: string | null | undefined): TimedLyric[] {
  if (!value) return [];
  const rows: TimedLyric[] = [];
  for (const line of value.split(/\r?\n/)) {
    const matches = [...line.matchAll(/\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g)];
    if (!matches.length) continue;
    const text = line.replace(/\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]/g, '').trim();
    for (const match of matches) rows.push({ time: Number(match[1]) * 60 + Number(match[2]), text });
  }
  return rows.sort((a, b) => a.time - b.time);
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);

  return `${min}:${String(sec).padStart(2, '0')}`;
}

export default function PlayerBar() {
  const {
    track,
    playing,
    toggle,
    next,
    prev,
    volume,
    setVolume,
    currentTime,
    duration,
    seek,
    repeatMode,
    setRepeatMode,
  } = usePlayer();

  const [expanded, setExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (expanded && showLyrics && activeLyricRef.current) activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [expanded, showLyrics, activeLyricIndex, track?.id]);
  const cycleRepeat = () => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');
  const timedLyrics = parseLyrics(track?.lyrics);
  const activeLyricIndex = timedLyrics.reduce((active, line, index) => line.time <= currentTime ? index : active, -1);

  if (!track) return null;

  const progress = duration > 0
    ? Math.min(100, (currentTime / duration) * 100)
    : 0;

  return (
    <>
      {/* Expanded Now Playing Panel */}
      {expanded && (
        <section
          className="fixed inset-0 z-[60] overflow-y-auto bg-[#fff7fb] text-[#54384a]"
          aria-label="Now Playing"
        >
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/15 blur-[110px]" />
            <div className="absolute bottom-[-150px] right-[-100px] h-[320px] w-[320px] rounded-full bg-fuchsia-600/10 blur-[100px]" />
          </div>

          <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 pb-10 pt-5 sm:px-8">
            {/* Panel header */}
            <header className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="ย่อแผงเล่นเพลง"
                className="grid h-11 w-11 place-items-center rounded-full border border-[#e9c8d8]/10 bg-[#f8e8ef]/5 transition hover:bg-[#f8e8ef]/10"
              >
                <ChevronDown size={24} />
              </button>

              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c45d8d]">
                  TDH48 MUSIC
                </p>
                <p className="mt-1 text-xs text-[#765568]/50">
                  Now Playing
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center text-[#c45d8d]/80">
                <Maximize2 size={20} />
              </div>
            </header>

            {/* Main content: player on the left, synchronized lyrics on the right */}
            <div className={`my-auto grid min-h-0 flex-1 items-stretch gap-6 py-5 md:grid-cols-2 md:gap-10 md:py-7 ${showLyrics ? '' : 'md:grid-cols-1'}`}>
              <div className="mx-auto flex w-full max-w-xl flex-col justify-center gap-5">
                <div className="px-2 text-center">
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-[#c45d8d]/70">กำลังเล่นเพลง</p>
                  <h1 className="break-words text-2xl font-bold leading-tight sm:text-4xl">{track.title}</h1>
                  <p className="mt-2 text-base text-[#a34f78]/70 sm:text-lg">{track.artist}</p>
                </div>
                <div className="mx-auto w-full max-w-[min(68vw,420px)]">
                  <div className="relative aspect-square">
                    <div className="absolute inset-4 rounded-[2rem] bg-pink-500/25 blur-2xl" />
                    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-[#e9c8d8]/10 bg-[#ffe8f2] shadow-2xl shadow-pink-950/20">
                      <img src={track.cover_url || '/cover-placeholder.svg'} alt={`ปกเพลง ${track.title}`} className={`h-full w-full object-cover ${playing ? 'scale-100' : 'scale-[0.97]'} transition-transform duration-700`} />
                      {!track.cover_url && <div className="absolute inset-0 grid place-items-center"><span className="text-6xl font-black text-[#c45d8d]/60">TDH48</span></div>}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-pink-300/20 bg-white px-4 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-[#a34f78]">{playing ? 'NOW PLAYING' : 'PAUSED'}</div>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-md px-2">
                  <input type="range" min={0} max={duration || 1} step={0.1} value={Math.min(currentTime, duration || 0)} onChange={(e) => seek(Number(e.target.value))} aria-label="ตำแหน่งเพลง" className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-pink-400" style={{ background: `linear-gradient(to right, #f472b6 ${progress}%, #ffffff80 ${progress}%)` }} />
                  <div className="mt-2 flex justify-between text-xs tabular-nums text-[#765568]/45"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
                  <div className="mt-4 flex items-center justify-center gap-8">
                    <button type="button" onClick={prev} aria-label="เพลงก่อนหน้า" className="text-[#765568]/65 transition hover:scale-110 hover:text-[#c45d8d]"><SkipBack size={26} fill="currentColor" /></button>
                    <button type="button" onClick={toggle} aria-label={playing ? 'หยุดเพลง' : 'เล่นเพลง'} className="grid h-14 w-14 place-items-center rounded-full bg-[#e98bb5] text-white shadow-xl shadow-pink-500/25 transition hover:scale-105 hover:bg-pink-300 active:scale-95">{playing ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" className="ml-1" />}</button>
                    <button type="button" onClick={next} aria-label="เพลงถัดไป" className="text-[#765568]/65 transition hover:scale-110 hover:text-[#c45d8d]"><SkipForward size={26} fill="currentColor" /></button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <button type="button" onClick={cycleRepeat} aria-label="เปลี่ยนโหมดเล่นซ้ำ" className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${repeatMode !== 'off' ? 'border-pink-300/50 bg-[#e98bb5]/15 text-[#a34f78]' : 'border-[#e9c8d8]/30 text-[#765568]/60 hover:text-[#a34f78]'}`}>
                      {repeatMode === 'one' ? <Repeat1 size={16}/> : <Repeat size={16}/>}
                      {repeatMode === 'off' ? 'เล่นปกติ' : repeatMode === 'all' ? 'เล่นวนทั้งคิว' : 'เล่นวนเพลงนี้'}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button type="button" onClick={() => setVolume(volume > 0 ? 0 : 0.8)} aria-label={volume === 0 ? 'เปิดเสียง' : 'ปิดเสียง'} className="text-[#765568]/60 transition hover:text-[#c45d8d]">{volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button>
                    <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="ปรับระดับเสียง" className="h-1 w-full max-w-56 cursor-pointer accent-pink-400"/>
                    <span className="w-9 text-right text-xs tabular-nums text-[#765568]/40">{Math.round(volume * 100)}%</span>
                  </div>
                </div>
              </div>
              {showLyrics && (
                <section className="relative flex min-h-[55vh] flex-col overflow-hidden rounded-3xl border border-pink-200/50 bg-white/55 px-4 pb-16 pt-5 shadow-sm md:min-h-0" aria-label="เนื้อเพลง Now Playing">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#c45d8d]/65">เนื้อเพลง</p>
                  <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-2 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
                    {!track.lyrics?.trim() ? (
                      <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-[#a34f78]/70">ยังไม่มีเนื้อเพลงสำหรับเพลงนี้</div>
                    ) : timedLyrics.length ? (
                      <div className="flex min-h-full flex-col items-center justify-center gap-5 py-[35vh] text-center">
                        {timedLyrics.map((line, index) => (
                          <p ref={index === activeLyricIndex ? activeLyricRef : null} key={index} className={`w-full whitespace-pre-wrap break-words text-base leading-7 transition-all duration-500 sm:text-lg ${index === activeLyricIndex ? 'scale-[1.03] font-bold text-[#c02d79]' : 'text-[#e6a6c7]'}`}>{line.text || '♪'}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words py-5 text-center text-base leading-8 text-[#e6a6c7]">{track.lyrics}</p>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowLyrics(false)} aria-label="ซ่อนเนื้อเพลง" title="ซ่อนเนื้อเพลง" className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-pink-200 bg-white text-[#a34f78] shadow-md transition hover:bg-pink-50"><Captions size={20}/></button>
                </section>
              )}
              {!showLyrics && <button type="button" onClick={() => setShowLyrics(true)} className="fixed bottom-8 right-8 z-[70] grid h-12 w-12 place-items-center rounded-full border border-pink-200 bg-white text-[#a34f78] shadow-lg transition hover:bg-pink-50" aria-label="แสดงเนื้อเพลง" title="แสดงเนื้อเพลง"><Captions size={21}/></button>}
            </div>

            <footer className="pb-2 text-center text-[10px] tracking-[0.2em] text-[#765568]/25">
              TDH48 MUSIC PLAYER
            </footer>
          </div>
        </section>
      )}

      {/* Compact sticky player bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-pink-400/20 bg-[#f8e8ef]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-[#54384a] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3">
          {/* Clicking the song details opens the expanded panel */}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="เปิด Now Playing"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-pink-400 md:w-[28%] md:flex-none"
          >
            <img
              src={track.cover_url || '/cover-placeholder.svg'}
              alt={track.title}
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
            />

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {track.title}
              </span>
              <span className="mt-0.5 block truncate text-xs text-[#a34f78]/60">
                {track.artist}
              </span>
            </span>
          </button>

          {/* Playback controls */}
          <div className="flex shrink-0 items-center gap-3 md:flex-1 md:flex-col md:gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={prev}
                aria-label="เพลงก่อนหน้า"
                className="text-[#765568]/60 transition hover:scale-110 hover:text-[#c45d8d]"
              >
                <SkipBack size={19} fill="currentColor" />
              </button>

              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'หยุดเพลง' : 'เล่นเพลง'}
                className="grid h-11 w-11 place-items-center rounded-full bg-[#e98bb5] text-white shadow-lg shadow-pink-500/25 transition hover:scale-105 hover:bg-pink-300 active:scale-95"
              >
                {playing ? (
                  <Pause size={20} fill="currentColor" />
                ) : (
                  <Play size={20} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={next}
                aria-label="เพลงถัดไป"
                className="text-[#765568]/60 transition hover:scale-110 hover:text-[#c45d8d]"
              >
                <SkipForward size={19} fill="currentColor" />
              </button>
            </div>

            {/* Desktop seek bar */}
            <div className="hidden w-full max-w-[600px] items-center gap-3 md:flex">
              <span className="w-10 text-right text-[11px] text-[#765568]/50">
                {formatTime(currentTime)}
              </span>

              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="ตำแหน่งเพลง"
                className="h-1 flex-1 cursor-pointer accent-pink-400"
              />

              <span className="w-10 text-[11px] text-[#765568]/50">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume and expand button */}
          <div className="flex flex-1 items-center justify-end gap-2 md:w-[28%] md:flex-none">
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              aria-label={volume === 0 ? 'เปิดเสียง' : 'ปิดเสียง'}
              className="hidden text-[#765568]/60 transition hover:text-[#c45d8d] sm:block"
            >
              {volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="ปรับระดับเสียง"
              className="hidden w-16 cursor-pointer accent-pink-400 sm:block sm:w-20"
            />

            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="เปิด Now Playing"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#765568]/60 transition hover:bg-[#f8e8ef]/10 hover:text-[#c45d8d]"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Mobile seek bar */}
        <div className="mt-2 flex items-center gap-2 md:hidden">
          <span className="w-8 text-[10px] tabular-nums text-[#765568]/50">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="ตำแหน่งเพลง"
            className="h-1 flex-1 cursor-pointer accent-pink-400"
          />

          <span className="w-8 text-right text-[10px] tabular-nums text-[#765568]/50">
            {formatTime(duration)}
          </span>
        </div>
      </footer>
    </>
  );
}
