'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type LiveStream = {
  id: number;
  is_live: boolean;
  youtube_url: string;
  title: string;
  description: string;
};

export default function LiveStreamAdmin() {
  const [supabase] = useState(() => createClient());
  const [stream, setStream] = useState<LiveStream>({
    id: 1,
    is_live: false,
    youtube_url: '',
    title: 'TDH48 LIVE',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from('live_streams')
        .select('id, is_live, youtube_url, title, description')
        .eq('id', 1)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setMessage('โหลดข้อมูล LIVE ไม่สำเร็จ: ' + error.message);
      } else if (data) {
        setStream({
          id: 1,
          is_live: Boolean(data.is_live),
          youtube_url: data.youtube_url || '',
          title: data.title || 'TDH48 LIVE',
          description: data.description || '',
        });
      }

      setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, [supabase]);

  async function save() {
    if (saving) return;

    const url = stream.youtube_url.trim();
    if (url) {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\\./, '');
        if (!['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
          setMessage('กรุณาใส่ลิงก์ YouTube ที่ถูกต้อง');
          return;
        }
      } catch {
        setMessage('รูปแบบลิงก์ YouTube ไม่ถูกต้อง');
        return;
      }
    }

    if (stream.is_live && !url) {
      setMessage('กรุณาใส่ลิงก์ YouTube ก่อนเปิดสถานะ LIVE');
      return;
    }

    setSaving(true);
    setMessage('กำลังบันทึก...');

    const { error } = await supabase.from('live_streams').upsert({
      id: 1,
      is_live: stream.is_live,
      youtube_url: url || null,
      title: stream.title.trim() || 'TDH48 LIVE',
      description: stream.description.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) {
      setMessage('บันทึกไม่สำเร็จ: ' + error.message);
    } else {
      setMessage('บันทึกการตั้งค่า LIVE เรียบร้อยแล้ว');
    }

    setSaving(false);
  }

  return (
    <section className="glass mt-8 rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-[.22em] text-fuchsia-200">YOUTUBE LIVE</p>
          <h2 className="mt-1 text-xl font-bold">จัดการถ่ายทอดสด</h2>
          <p className="mt-1 text-sm text-white/50">ตั้งค่าลิงก์และสถานะ LIVE ที่หน้าเว็บไซต์</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-bold ${stream.is_live ? 'bg-red-500/15 text-red-300' : 'bg-white/10 text-white/60'}`}>
          {stream.is_live ? '● LIVE' : 'OFFLINE'}
        </span>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-white/50">กำลังโหลดข้อมูล LIVE...</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm">ชื่อตอน / ชื่อรายการ</label>
            <input
              value={stream.title}
              onChange={(event) => setStream((current) => ({ ...current, title: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none"
              placeholder="TDH48 LIVE"
            />
          </div>

          <div>
            <label className="text-sm">ลิงก์ YouTube Live</label>
            <input
              type="url"
              inputMode="url"
              value={stream.youtube_url}
              onChange={(event) => setStream((current) => ({ ...current, youtube_url: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="mt-2 text-xs text-white/40">รองรับลิงก์ YouTube ปกติ, youtu.be และลิงก์ Live</p>
          </div>

          <div>
            <label className="text-sm">รายละเอียด (ไม่บังคับ)</label>
            <textarea
              rows={3}
              value={stream.description}
              onChange={(event) => setStream((current) => ({ ...current, description: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none"
              placeholder="รายละเอียดการถ่ายทอดสด..."
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-4">
            <input
              type="checkbox"
              checked={stream.is_live}
              onChange={(event) => setStream((current) => ({ ...current, is_live: event.target.checked }))}
              className="h-5 w-5 accent-red-500"
            />
            <span>
              <span className="block text-sm font-semibold">เปิดสถานะ LIVE</span>
              <span className="block text-xs text-white/45">เปิดเมื่อเริ่มถ่ายทอดสดจริง และปิดเมื่อจบรายการ</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="rounded-xl bg-fuchsia-200 px-5 py-3 text-sm font-bold text-purple-950 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า LIVE'}
            </button>
            <a href="/live" target="_blank" rel="noreferrer" className="rounded-xl border border-white/15 px-5 py-3 text-sm hover:bg-white/5">
              ดูหน้า LIVE
            </a>
          </div>

          {message && <p role="status" className="break-words text-sm text-fuchsia-200">{message}</p>}
        </div>
      )}
    </section>
  );
}
