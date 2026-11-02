'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock3, Pause, Play, RotateCcw, Save, X } from 'lucide-react';
import type { Track } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

type Props = {
  track: Track;
  supabase: ReturnType<typeof createClient>;
  onClose: () => void;
  onSaved: (trackId: string, lyrics: string | null) => void;
};

type LyricLine = { text: string; time: number | null };

function formatTime(seconds: number) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  const secs = (safe % 60).toFixed(2).padStart(5, '0');
  return `${String(minutes).padStart(2, '0')}:${secs}`;
}

function toLrcTime(seconds: number) {
  const centiseconds = Math.floor(Math.max(0, seconds) * 100);
  const minutes = Math.floor(centiseconds / 6000);
  const remaining = (centiseconds % 6000) / 100;
  return `[${String(minutes).padStart(2, '0')}:${remaining.toFixed(2).padStart(5, '0')}]`;
}

function cleanLine(line: string) {
  return line.replace(/^\s*\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]\s*/, '').trimEnd();
}

export default function LyricsTimestampEditor({ track, supabase, onClose, onSaved }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [draft, setDraft] = useState(() =>
    (track.lyrics || '').split(/\r?\n/).map(cleanLine).join('\n')
  );
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const stampedCount = useMemo(() => lines.filter((line) => line.time !== null).length, [lines]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  async function startCapture() {
    const prepared = draft.split(/\r?\n/).map((text) => text.trimEnd()).filter((text) => text.trim()).map((text) => ({ text, time: null as number | null }));
    if (!prepared.some((line) => line.text.trim())) {
      setMessage('กรุณาใส่เนื้อเพลงอย่างน้อย 1 บรรทัดก่อนกดเริ่ม');
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    setLines(prepared);
    setActiveIndex(0);
    setCurrentTime(0);
    setStarted(true);
    setMessage('เริ่มเล่นเพลงแล้ว กดปุ่มนาฬิกาเมื่อถึงจังหวะเริ่มของแต่ละบรรทัด');
    audio.currentTime = 0;
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setMessage('เบราว์เซอร์ยังไม่เริ่มเล่นเพลง กรุณากดเล่นจากเครื่องเล่นเสียง แล้วกดนาฬิกาตามจังหวะ');
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setMessage('ไม่สามารถเล่นไฟล์เสียงนี้ได้ กรุณาตรวจสอบไฟล์เพลง');
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function stampCurrentLine() {
    const audio = audioRef.current;
    if (!audio || !started || activeIndex >= lines.length) return;
    const time = audio.currentTime;
    setLines((current) => current.map((line, index) => index === activeIndex ? { ...line, time } : line));
    if (activeIndex < lines.length - 1) {
      setActiveIndex((index) => index + 1);
      setMessage(`บันทึกเวลา ${formatTime(time)} แล้ว พร้อมจับเวลาบรรทัดถัดไป`);
    } else {
      setActiveIndex(lines.length);
      setMessage('ประทับเวลาครบทุกบรรทัดแล้ว ตรวจสอบและกดบันทึกได้เลย');
    }
  }

  function resetCapture() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setLines([]);
    setActiveIndex(0);
    setStarted(false);
    setPlaying(false);
    setCurrentTime(0);
    setMessage('รีเซ็ตการจับเวลาแล้ว กดเริ่มเพื่อจับเวลาใหม่');
  }

  async function saveLyrics() {
    if (saving) return;
    setSaving(true);
    setMessage('กำลังบันทึกเนื้อเพลง...');
    try {
      const lyrics = started
        ? lines.map((line) => `${line.time === null ? '' : toLrcTime(line.time)}${line.text}`).join('\n').trim()
        : draft.trim();
      const { error } = await supabase.from('tracks').update({ lyrics: lyrics || null }).eq('id', track.id);
      if (error) throw error;
      onSaved(track.id, lyrics || null);
      setMessage('บันทึกเนื้อเพลงเรียบร้อยแล้ว');
      if (audioRef.current) audioRef.current.pause();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'บันทึกเนื้อเพลงไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="ระบบแก้ไขเนื้อเพลงและประทับเวลา">
      <section className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-pink-200/20 bg-[#21172b] p-5 text-white shadow-2xl sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[.2em] text-pink-200">LYRICS STUDIO</p>
            <h2 className="mt-1 text-2xl font-black">แก้ไขเนื้อเพลง</h2>
            <p className="mt-1 text-sm text-white/55">{track.title} · {track.artist}</p>
          </div>
          <button type="button" onClick={() => { if (audioRef.current) audioRef.current.pause(); onClose(); }} className="rounded-xl border border-white/15 p-2 hover:bg-white/10" aria-label="ปิดระบบแก้ไขเนื้อเพลง"><X size={20} /></button>
        </header>

        <audio
          ref={audioRef}
          src={track.audio_url}
          controls
          preload="metadata"
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          className="mt-5 w-full"
        />

        {!started ? (
          <div className="mt-5">
            <label className="text-sm font-semibold">เนื้อเพลง (ใส่เนื้อเพลงทั้งหมด แยกบรรทัดละ 1 ท่อน)</label>
            <textarea
              rows={12}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={'ใส่เนื้อเพลงที่นี่\nหนึ่งบรรทัดต่อหนึ่งจุดประทับเวลา'}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 leading-7 outline-none focus:border-pink-200/60"
            />
            <button type="button" onClick={() => void startCapture()} disabled={!track.audio_url} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-pink-200 px-5 py-3 font-bold text-purple-950 hover:bg-pink-100 disabled:opacity-50">
              <Play size={18} fill="currentColor" /> เริ่มเล่นเพลงและจับเวลา
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pink-200/20 bg-pink-200/5 p-4">
              <div>
                <p className="text-xs text-white/50">ตำแหน่งเพลงปัจจุบัน</p>
                <p className="mt-1 font-mono text-2xl font-bold text-pink-100">{formatTime(currentTime)}</p>
                <p className="mt-1 text-xs text-white/55">ประทับเวลาแล้ว {stampedCount} / {lines.length} บรรทัด</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void togglePlayback()} className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/10">
                  {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'หยุดชั่วคราว' : 'เล่นต่อ'}
                </button>
                <button type="button" onClick={resetCapture} className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm hover:bg-white/10"><RotateCcw size={16} /> เริ่มจับเวลาใหม่</button>
              </div>
            </div>

            <button
              type="button"
              onClick={stampCurrentLine}
              disabled={activeIndex >= lines.length || !playing}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-pink-200 px-5 py-4 text-lg font-black text-purple-950 hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Clock3 size={24} />
              {activeIndex >= lines.length ? 'จับเวลาครบทุกบรรทัดแล้ว' : `ประทับเวลาบรรทัดที่ ${activeIndex + 1}`}
            </button>
            <p className="mt-2 text-center text-xs text-white/50">กดนาฬิกาตรงจังหวะเริ่มร้องของบรรทัดปัจจุบัน ระบบจะบันทึกเวลาและเลื่อนไปบรรทัดถัดไปโดยอัตโนมัติ</p>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {lines.map((line, index) => (
                <div key={index} className={`flex items-start gap-3 rounded-xl border p-3 ${index === activeIndex ? 'border-pink-200/60 bg-pink-200/10' : 'border-white/10 bg-black/10'}`}>
                  <span className="w-7 shrink-0 pt-0.5 text-xs text-white/40">{index + 1}</span>
                  <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6">{line.text || <span className="italic text-white/30">(บรรทัดว่าง)</span>}</p>
                  <div className="shrink-0 text-right">
                    {line.time === null ? <span className="text-xs text-white/30">ยังไม่จับเวลา</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-200"><Check size={13} /> {formatTime(line.time)}</span>}
                    {line.time !== null && <button type="button" onClick={() => { setActiveIndex(index); setMessage('เลือกบรรทัดนี้แล้ว กดนาฬิกาอีกครั้งเพื่อประทับเวลาใหม่'); }} className="mt-1 block text-[10px] text-pink-200/80 hover:text-pink-100">จับเวลาใหม่</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {message && <p className="mt-4 break-words text-sm text-pink-100" role="status">{message}</p>}
        <footer className="mt-6 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => { if (audioRef.current) audioRef.current.pause(); onClose(); }} disabled={saving} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5 disabled:opacity-50">ปิด</button>
          <button type="button" onClick={() => void saveLyrics()} disabled={saving || (started && stampedCount < lines.length)} title={started && stampedCount < lines.length ? "กรุณาประทับเวลาให้ครบทุกบรรทัดก่อนบันทึก" : undefined} className="flex items-center justify-center gap-2 rounded-xl bg-pink-200 px-5 py-3 text-sm font-bold text-purple-950 disabled:opacity-50"><Save size={17} /> {saving ? 'กำลังบันทึก...' : started && stampedCount < lines.length ? 'จับเวลาให้ครบก่อนบันทึก' : 'บันทึกเนื้อเพลง'}</button>
        </footer>
      </section>
    </div>
  );
}
