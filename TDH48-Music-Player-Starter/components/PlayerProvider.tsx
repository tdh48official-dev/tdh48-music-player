'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { ReactNode, RefObject } from 'react';
import type { Track } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

type PlayerContextType = {
  track: Track | null;
  playing: boolean;
  queue: Track[];
  volume: number;
  currentTime: number;
  duration: number;
  audio: RefObject<HTMLAudioElement | null>;
  play: (track: Track) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  repeatMode: 'off' | 'all' | 'one';
  setRepeatMode: (mode: 'off' | 'all' | 'one') => void;
  shuffle: boolean;
  setShuffle: (enabled: boolean) => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const countedTrackRef = useRef<string | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueueState] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [shuffle, setShuffle] = useState(false);

  const setQueue = useCallback((tracks: Track[]) => {
    setQueueState(tracks);
  }, []);

  const addToQueue = useCallback((item: Track) => {
    setQueueState((current) => current.some((t) => t.id === item.id) ? current : [...current, item]);
  }, []);

  const play = useCallback((newTrack: Track) => {
    if (track?.id === newTrack.id && audio.current) {
      audio.current.play().catch(() => setPlaying(false));
      return;
    }

    setCurrentTime(0);
    setDuration(0);
    setTrack(newTrack);
    setPlaying(true);
  }, [track]);

  const next = useCallback(() => {
    if (!queue.length) return;

    const currentIndex = queue.findIndex(
      (item) => item.id === track?.id
    );

    const nextIndex = shuffle && queue.length > 1
      ? (() => { const choices = queue.map((_, index) => index).filter(index => index !== currentIndex); return choices[Math.floor(Math.random() * choices.length)]; })()
      : currentIndex + 1;
    if (nextIndex >= queue.length && repeatMode === 'off') {
      setPlaying(false);
      return;
    }
    setTrack(queue[nextIndex >= queue.length ? 0 : Math.max(0, nextIndex)]);
    setCurrentTime(0);
    setPlaying(true);
  }, [queue, track, repeatMode, shuffle]);

  const prev = useCallback(() => {
    if (!audio.current) return;

    if (audio.current.currentTime > 3) {
      audio.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (!queue.length) {
      audio.current.currentTime = 0;
      return;
    }

    const currentIndex = queue.findIndex(
      (item) => item.id === track?.id
    );

    const prevIndex =
      currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;

    setTrack(queue[prevIndex]);
    setCurrentTime(0);
    setPlaying(true);
  }, [queue, track]);

  const toggle = useCallback(() => {
    if (!audio.current || !track) return;

    if (audio.current.paused) {
      audio.current.play().catch(() => setPlaying(false));
    } else {
      audio.current.pause();
    }
  }, [track]);

  const setVolume = useCallback((value: number) => {
    const safeValue = Math.min(1, Math.max(0, value));
    setVolumeState(safeValue);

    if (audio.current) {
      audio.current.volume = safeValue;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (!audio.current) return;

    const safeTime = Math.max(0, Math.min(time, duration || 0));
    audio.current.currentTime = safeTime;
    setCurrentTime(safeTime);
  }, [duration]);

  useEffect(() => {
    if (!audio.current || !track) return;

    const player = audio.current;
    player.src = track.audio_url;
    player.volume = volume;
    player.load();

    player.play().catch(() => setPlaying(false));
  }, [track]);

  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
    }
  }, [volume]);

  return (
    <PlayerContext.Provider
      value={{
        track,
        playing,
        queue,
        volume,
        currentTime,
        duration,
        audio,
        play,
        toggle,
        next,
        prev,
        setQueue,
        addToQueue,
        setVolume,
        seek,
        repeatMode,
        setRepeatMode,
        shuffle,
        setShuffle,
      }}
    >
      {children}

      <audio
        ref={audio}
        preload="metadata"
        onTimeUpdate={(e) =>
          setCurrentTime(e.currentTarget.currentTime)
        }
        onLoadedMetadata={(e) =>
          setDuration(e.currentTarget.duration || 0)
        }
        onDurationChange={(e) =>
          setDuration(e.currentTarget.duration || 0)
        }
        onPlay={() => {
          setPlaying(true);
          if (track && countedTrackRef.current !== track.id) {
            countedTrackRef.current = track.id;
            void supabase.from('track_plays').insert({ track_id: track.id }).then(({ error }) => {
              if (error) console.warn('Could not record track play:', error.message);
            });
          }
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          if (repeatMode === 'one' && audio.current) {
            audio.current.currentTime = 0;
            audio.current.play().catch(() => setPlaying(false));
            return;
          }
          next();
        }}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error('PlayerProvider missing');
  }

  return context;
}
