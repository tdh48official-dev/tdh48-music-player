
'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Maximize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { usePlayer } from './PlayerProvider';

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
  } = usePlayer();

  const [expanded, setExpanded] = useState(false);

  if (!track) return null;

  const progress = duration > 0
    ? Math.min(100, (currentTime / duration) * 100)
    : 0;

  return (
    <>
      {/* Expanded Now Playing Panel */}
      {expanded && (
        <section
          className="fixed inset-0 z-[60] overflow-y-auto bg-[#080608] text-white"
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
                className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
              >
                <ChevronDown size={24} />
              </button>

              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-pink-300">
                  TDH48 MUSIC
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Now Playing
                </p>
              </div>

              <div className="grid h-11 w-11 place-items-center text-pink-300/80">
                <Maximize2 size={20} />
              </div>
            </header>

            {/* Main content */}
            <div className="my-auto grid items-center gap-8 py-8 md:grid-cols-2 md:gap-14 md:py-12">
              {/* Album cover */}
              <div className="mx-auto w-full max-w-[340px] sm:max-w-[400px] md:max-w-none">
                <div className="relative aspect-square">
                  <div className="absolute inset-4 rounded-[2rem] bg-pink-500/25 blur-2xl" />

                  <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-[#181018] shadow-2xl shadow-pink-950/40">
                    <img
                      src={track.cover_url || '/cover-placeholder.svg'}
                      alt={`ปกเพลง ${track.title}`}
                      className={`h-full w-full object-cover ${
                        playing ? 'scale-100' : 'scale-[0.97]'
                      } transition-transform duration-700`}
                    />

                    {!track.cover_url && (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="text-6xl font-black text-pink-300/60">
                          TDH48
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-pink-300/20 bg-[#171017] px-4 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-pink-200">
                    {playing ? 'NOW PLAYING' : 'PAUSED'}
                  </div>
                </div>
              </div>

              {/* Track details and controls */}
              <div className="mx-auto w-full max-w-lg">
                <div className="mb-7 text-center md:text-left">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-pink-300/70">
                    กำลังเล่นเพลง
                  </p>

                  <h1 className="break-words text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">
                    {track.title}
                  </h1>

                  <p className="mt-3 text-base text-pink-200/70 sm:text-lg">
                    {track.artist}
                  </p>
                </div>

                {/* Seek bar */}
                <div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={(e) => seek(Number(e.target.value))}
                    aria-label="ตำแหน่งเพลง"
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full accent-pink-400"
                    style={{
                      background: `linear-gradient(to right, #f472b6 ${progress}%, #ffffff20 ${progress}%)`,
                    }}
                  />

                  <div className="mt-2 flex justify-between text-xs tabular-nums text-white/45">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback controls */}
                <div className="mt-7 flex items-center justify-center gap-8 md:justify-start md:gap-10">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="เพลงก่อนหน้า"
                    className="text-white/65 transition hover:scale-110 hover:text-pink-300"
                  >
                    <SkipBack size={28} fill="currentColor" />
                  </button>

                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={playing ? 'หยุดเพลง' : 'เล่นเพลง'}
                    className="grid h-16 w-16 place-items-center rounded-full bg-pink-400 text-[#210914] shadow-xl shadow-pink-500/25 transition hover:scale-105 hover:bg-pink-300 active:scale-95"
                  >
                    {playing ? (
                      <Pause size={28} fill="currentColor" />
                    ) : (
                      <Play size={28} fill="currentColor" className="ml-1" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={next}
                    aria-label="เพลงถัดไป"
                    className="text-white/65 transition hover:scale-110 hover:text-pink-300"
                  >
                    <SkipForward size={28} fill="currentColor" />
                  </button>
                </div>

                {/* Volume */}
                <div className="mt-9 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
                    aria-label={volume === 0 ? 'เปิดเสียง' : 'ปิดเสียง'}
                    className="text-white/60 transition hover:text-pink-300"
                  >
                    {volume === 0 ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
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
                    className="h-1 w-full max-w-56 cursor-pointer accent-pink-400"
                  />

                  <span className="w-9 text-right text-xs tabular-nums text-white/40">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <footer className="pb-2 text-center text-[10px] tracking-[0.2em] text-white/25">
              TDH48 MUSIC PLAYER
            </footer>
          </div>
        </section>
      )}

      {/* Compact sticky player bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-pink-400/20 bg-[#080808]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 text-white backdrop-blur-2xl">
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
              <span className="mt-0.5 block truncate text-xs text-pink-200/60">
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
                className="text-white/60 transition hover:scale-110 hover:text-pink-300"
              >
                <SkipBack size={19} fill="currentColor" />
              </button>

              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? 'หยุดเพลง' : 'เล่นเพลง'}
                className="grid h-11 w-11 place-items-center rounded-full bg-pink-400 text-[#210914] shadow-lg shadow-pink-500/25 transition hover:scale-105 hover:bg-pink-300 active:scale-95"
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
                className="text-white/60 transition hover:scale-110 hover:text-pink-300"
              >
                <SkipForward size={19} fill="currentColor" />
              </button>
            </div>

            {/* Desktop seek bar */}
            <div className="hidden w-full max-w-[600px] items-center gap-3 md:flex">
              <span className="w-10 text-right text-[11px] text-white/50">
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

              <span className="w-10 text-[11px] text-white/50">
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
              className="hidden text-white/60 transition hover:text-pink-300 sm:block"
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
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-pink-300"
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>

        {/* Mobile seek bar */}
        <div className="mt-2 flex items-center gap-2 md:hidden">
          <span className="w-8 text-[10px] tabular-nums text-white/50">
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

          <span className="w-8 text-right text-[10px] tabular-nums text-white/50">
            {formatTime(duration)}
          </span>
        </div>
      </footer>
    </>
  );
}
