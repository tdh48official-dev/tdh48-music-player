
'use client';

import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { usePlayer } from './PlayerProvider';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00';

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

  if (!track) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-pink-400/20 bg-[#080808]/95 px-3 pb-3 pt-3 text-white backdrop-blur-2xl">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3">

        {/* เพลงที่กำลังเล่น */}
        <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[28%] md:flex-none">
          <img
            src={track.cover_url || '/cover-placeholder.svg'}
            alt={track.title}
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {track.title}
            </div>

            <div className="truncate text-xs text-pink-200/60">
              {track.artist}
            </div>
          </div>
        </div>

        {/* ปุ่มควบคุม */}
        <div className="flex shrink-0 items-center gap-3 md:flex-1 md:flex-col md:gap-2">
          <div className="flex items-center gap-4">

            <button
              onClick={prev}
              aria-label="เพลงก่อนหน้า"
              className="text-white/60 transition hover:scale-110 hover:text-pink-300"
            >
              <SkipBack size={21} fill="currentColor" />
            </button>

            <button
              onClick={toggle}
              aria-label={playing ? 'หยุดเพลง' : 'เล่นเพลง'}
              className="grid h-12 w-12 place-items-center rounded-full bg-pink-400 text-[#210914] shadow-lg shadow-pink-500/30 transition duration-200 hover:scale-110 hover:bg-pink-300 active:scale-95"
            >
              {playing ? (
                <Pause size={22} fill="currentColor" />
              ) : (
                <Play size={22} fill="currentColor" className="ml-1" />
              )}
            </button>

            <button
              onClick={next}
              aria-label="เพลงถัดไป"
              className="text-white/60 transition hover:scale-110 hover:text-pink-300"
            >
              <SkipForward size={21} fill="currentColor" />
            </button>
          </div>

          {/* แถบเวลา Desktop */}
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

        {/* ปรับเสียง */}
        <div className="flex flex-1 items-center justify-end gap-2 md:w-[28%] md:flex-none">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            aria-label={volume === 0 ? 'เปิดเสียง' : 'ปิดเสียง'}
            className="text-white/60 transition hover:text-pink-300"
          >
            {volume === 0 ? (
              <VolumeX size={19} />
            ) : (
              <Volume2 size={19} />
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
            className="w-16 cursor-pointer accent-pink-400 sm:w-24"
          />
        </div>
      </div>

      {/* แถบเวลา Mobile */}
      <div className="mt-2 flex items-center gap-2 md:hidden">
        <span className="text-[10px] text-white/50">
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

        <span className="text-[10px] text-white/50">
          {formatTime(duration)}
        </span>
      </div>
    </footer>
  );
}
