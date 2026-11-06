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

  // Publish the current track to the device's native media controls
  // (lock screen, notification shade, Control Center, and headset buttons).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const session = navigator.mediaSession;
    if (!track) {
      session.metadata = null;
      session.playbackState = 'none';
      return;
    }

    const artworkUrl = track.cover_url
      ? new URL(track.cover_url, window.location.origin).href
      : new URL('/cover-placeholder.svg', window.location.origin).href;

    session.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'TDH48 Music',
      artwork: [
        { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    return () => {
      session.metadata = null;
    };
  }, [track]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = !track ? 'none' : playing ? 'playing' : 'paused';
  }, [track, playing]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const session = navigator.mediaSession;
    const safelySetHandler = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null,
    ) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Some browsers expose Media Session but do not support every action.
      }
    };

    safelySetHandler('play', () => {
      if (audio.current?.paused) audio.current.play().catch(() => setPlaying(false));
    });
    safelySetHandler('pause', () => audio.current?.pause());
    safelySetHandler('previoustrack', prev);
    safelySetHandler('nexttrack', next);
    safelySetHandler('seekbackward', (details) => {
      const offset = details.seekOffset ?? 10;
      seek(Math.max(0, (audio.current?.currentTime ?? currentTime) - offset));
    });
    safelySetHandler('seekforward', (details) => {
      const offset = details.seekOffset ?? 10;
      seek(Math.min(duration || Infinity, (audio.current?.currentTime ?? currentTime) + offset));
    });
    safelySetHandler('seekto', (details) => {
      if (typeof details.seekTime === 'number') seek(details.seekTime);
    });

    return () => {
      safelySetHandler('play', null);
      safelySetHandler('pause', null);
      safelySetHandler('previoustrack', null);
      safelySetHandler('nexttrack', null);
      safelySetHandler('seekbackward', null);
      safelySetHandler('seekforward', null);
      safelySetHandler('seekto', null);
    };
  }, [prev, next, seek, duration, currentTime]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!duration || !Number.isFinite(duration)) return;

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.max(0, Math.min(currentTime, duration)),
      });
    } catch {
      // Position state is optional and may be unavailable on older browsers.
    }
  }, [currentTime, duration, track]);

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
        onPlay={async () => {
          setPlaying(true);
          if (track && countedTrackRef.current !== track.id) {
            countedTrackRef.current = track.id;
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('track_plays').insert({
              track_id: track.id,
              user_id: user?.id ?? null,
            });
            if (error) {
              console.warn('Could not record track play:', error.message);
            } else if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('tdh48:track-played', { detail: { trackId: track.id } }));
            }
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
