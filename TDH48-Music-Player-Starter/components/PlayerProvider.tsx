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

  const loadPublishedQueue = useCallback(async (): Promise<Track[]> => {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Could not load fallback playback queue:', error.message);
      return [];
    }

    const tracks = (data ?? []) as Track[];
    if (tracks.length) {
      setQueueState((current) => current.length ? current : tracks);
    }
    return tracks;
  }, [supabase]);

  // Preload a fallback queue so lock-screen skip controls also work when
  // playback was started from a page that did not explicitly set a queue.
  useEffect(() => {
    void loadPublishedQueue();
  }, [loadPublishedQueue]);

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

  const next = useCallback(async () => {
    const activeQueue = queue.length ? queue : await loadPublishedQueue();
    if (!activeQueue.length) return;

    const currentIndex = activeQueue.findIndex((item) => item.id === track?.id);
    const nextIndex = shuffle && activeQueue.length > 1
      ? (() => {
          const choices = activeQueue.map((_, index) => index).filter((index) => index !== currentIndex);
          return choices[Math.floor(Math.random() * choices.length)];
        })()
      : currentIndex < 0 ? 0 : currentIndex + 1;

    if (nextIndex >= activeQueue.length && repeatMode === 'off') {
      setPlaying(false);
      return;
    }

    setTrack(activeQueue[nextIndex >= activeQueue.length ? 0 : Math.max(0, nextIndex)]);
    setCurrentTime(0);
    setPlaying(true);
  }, [queue, track, repeatMode, shuffle, loadPublishedQueue]);

  const prev = useCallback(async () => {
    const activeQueue = queue.length ? queue : await loadPublishedQueue();
    if (!activeQueue.length) {
      if (audio.current) audio.current.currentTime = 0;
      return;
    }

    const currentIndex = activeQueue.findIndex((item) => item.id === track?.id);
    const prevIndex = currentIndex < 0 || currentIndex === 0
      ? activeQueue.length - 1
      : currentIndex - 1;

    setTrack(activeQueue[prevIndex]);
    setCurrentTime(0);
    setPlaying(true);
  }, [queue, track, loadPublishedQueue]);

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
    if (audio.current) audio.current.volume = volume;
  }, [volume]);

  // Serve a small, normalized JPEG to lock-screen clients. Native media
  // controls often fail silently on large PNG originals and transformed URLs.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !track) return;

    const session = navigator.mediaSession;
    const originalCover = track.cover_url?.trim()
      ? track.cover_url.trim()
      : new URL('/tdh48-logo.png', window.location.origin).toString();

    const artworkUrl = originalCover.includes('/storage/v1/object/public/tdh48-covers/')
      ? new URL('/api/lockscreen-artwork', window.location.origin)
      : new URL(originalCover, window.location.origin);
    if (artworkUrl.pathname === '/api/lockscreen-artwork') {
      artworkUrl.searchParams.set('url', originalCover);
    }

    if (typeof MediaMetadata !== 'undefined') {
      session.metadata = new MediaMetadata({
        title: track.title || 'TDH48 Music',
        artist: track.artist || 'TDH48',
        album: track.album || 'TDH48 Music',
        artwork: [
          {
            src: artworkUrl.toString(),
            sizes: '512x512',
            type: 'image/jpeg',
          },
          ...(artworkUrl.toString() !== originalCover
            ? [{ src: originalCover, type: 'image/png' }]
            : []),
        ],
      });
    }

    const register = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Some browsers expose Media Session but do not support every action.
      }
    };

    register('play', () => {
      audio.current?.play().catch(() => setPlaying(false));
    });
    register('pause', () => audio.current?.pause());
    // Explicitly clear time-skip actions so iOS/Android expose track-skip
    // controls instead of the default +/- 10 second buttons.
    register('seekbackward', null);
    register('seekforward', null);
    register('seekto', null);
    register('previoustrack', () => { void prev(); });
    register('nexttrack', () => { void next(); });

    return () => {
      register('play', null);
      register('pause', null);
      register('previoustrack', null);
      register('nexttrack', null);
      register('seekbackward', null);
      register('seekforward', null);
      register('seekto', null);
    };
  }, [track, prev, next]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';

    if (duration > 0 && Number.isFinite(duration)) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: audio.current?.playbackRate || 1,
          position: Math.min(currentTime, duration),
        });
      } catch {
        // Ignore unsupported or temporarily invalid position states.
      }
    }
  }, [playing, currentTime, duration, track]);

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
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
        onPlay={async () => {
          setPlaying(true);
          if (track && countedTrackRef.current !== track.id) {
            countedTrackRef.current = track.id;
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('track_plays').insert({
              track_id: track.id,
              user_id: user?.id ?? null,
            });
            if (error) console.warn('Could not record track play:', error.message);
          }
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          if (repeatMode === 'one' && audio.current) {
            audio.current.currentTime = 0;
            audio.current.play().catch(() => setPlaying(false));
            return;
          }
          void next();
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
