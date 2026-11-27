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

  // Publish the current track to the device's native lock-screen / media controls.
  // Supported by modern Android browsers and Safari on supported iOS versions.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !track) return;

    const session = navigator.mediaSession;
    const cover = track.cover_url
      ? track.cover_url
      : new URL('/tdh48-logo.png', window.location.origin).toString();
    const imageType = /\\.png(?:[?#]|$)/i.test(cover) ? 'image/png' : 'image/jpeg';

    if (typeof MediaMetadata !== 'undefined') {
      session.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist || 'TDH48',
        album: track.album || 'TDH48 Music',
        artwork: [
          { src: cover, sizes: '96x96', type: imageType },
          { src: cover, sizes: '128x128', type: imageType },
          { src: cover, sizes: '192x192', type: imageType },
          { src: cover, sizes: '256x256', type: imageType },
          { src: cover, sizes: '384x384', type: imageType },
          { src: cover, sizes: '512x512', type: imageType },
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
    register('previoustrack', prev);
    register('nexttrack', next);
    register('seekbackward', (details) => {
      if (audio.current) audio.current.currentTime = Math.max(0, audio.current.currentTime - (details.seekOffset ?? 10));
    });
    register('seekforward', (details) => {
      if (audio.current) audio.current.currentTime = Math.min(audio.current.duration || Infinity, audio.current.currentTime + (details.seekOffset ?? 10));
    });
    register('seekto', (details) => {
      if (audio.current && details.seekTime !== undefined) {
        audio.current.currentTime = details.seekTime;
        if (details.fastSeek && 'fastSeek' in audio.current) {
          audio.current.fastSeek(details.seekTime);
        }
      }
    });

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
