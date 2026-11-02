
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Track } from '@/lib/types';

import { createClient } from '@/lib/supabase/client';
import OfficialPlaylistsAdmin from '@/components/OfficialPlaylistsAdmin';

import {
  Upload,
  Trash2,
  LogOut,
  Music2,
  Plus,
  ExternalLink,
  Pencil,
  Star,
} from 'lucide-react';

export default function Admin() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('TDH48');
  const [category, setCategory] = useState('Single');
  const [album, setAlbum] = useState('');

  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [featured, setFeatured] = useState(false);

  const [busy, setBusy] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('TDH48');
  const [editCategory, setEditCategory] = useState('Single');
  const [editAlbum, setEditAlbum] = useState('');
  const [editReleaseDate, setEditReleaseDate] = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editPublished, setEditPublished] = useState(true);
  const [editLyricsText, setEditLyricsText] = useState('');
  const [editAudio, setEditAudio] = useState<File | null>(null);
  const [editCover, setEditCover] = useState<File | null>(null);
  const [removeEditCover, setRemoveEditCover] = useState(false);
  const [editConfirm, setEditConfirm] = useState<'save' | 'cancel' | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  // สร้าง Supabase Client หลังจากเปิดหน้าเว็บบน Browser
  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (error) {
      console.error('Supabase initialization error:', error);
      setMsg('ไม่สามารถเชื่อมต่อ Supabase ได้ กรุณาตรวจสอบ Environment Variables');
      setLoading(false);
    }
  }, []);

  // โหลดรายการเพลง
  const load = useCallback(async () => {
    if (!supabase) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load tracks error:', error.message);
      setMsg(error.message);
    } else {
      setTracks((data || []) as Track[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (supabase) {
      load();
    }
  }, [supabase, load]);

  function readAudioDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const audioElement = document.createElement('audio');
      const objectUrl = URL.createObjectURL(file);
      audioElement.preload = 'metadata';
      audioElement.onloadedmetadata = () => {
        const duration = Number.isFinite(audioElement.duration) ? Math.round(audioElement.duration) : null;
        URL.revokeObjectURL(objectUrl);
        resolve(duration);
      };
      audioElement.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      audioElement.src = objectUrl;
    });
  }

  // อ่านความยาวจาก metadata ของไฟล์เสียงที่มีอยู่ แล้วบันทึกลงฐานข้อมูล
  function getAudioDuration(url: string): Promise<number | null> {
    return new Promise((resolve) => {
      const audioElement = document.createElement('audio');
      let settled = false;
      const finish = (value: number | null) => {
        if (settled) return;
        settled = true;
        audioElement.removeAttribute('src');
        audioElement.load();
        resolve(value);
      };
      const timeout = window.setTimeout(() => finish(null), 20000);
      audioElement.preload = 'metadata';
      audioElement.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        finish(Number.isFinite(audioElement.duration) ? Math.round(audioElement.duration) : null);
      };
      audioElement.onerror = () => {
        window.clearTimeout(timeout);
        finish(null);
      };
      audioElement.src = url;
    });
  }

  async function fillMissingDurations() {
    if (!supabase || busy) return;
    const missing = tracks.filter((track) => track.duration_seconds == null && track.audio_url);
    if (missing.length === 0) {
      setMsg('ทุกเพลงมีข้อมูลความยาวแล้ว');
      return;
    }

    setBusy(true);
    let saved = 0;
    let failed = 0;
    for (let index = 0; index < missing.length; index++) {
      const track = missing[index];
      setMsg(`กำลังตรวจจับความยาวเพลง ${index + 1}/${missing.length}: ${track.title}`);
      const duration = await getAudioDuration(track.audio_url);
      if (duration == null) {
        failed++;
        continue;
      }
      const { error } = await supabase
        .from('tracks')
        .update({ duration_seconds: duration })
        .eq('id', track.id);
      if (error) {
        failed++;
      } else {
        saved++;
        setTracks((current) => current.map((item) =>
          item.id === track.id ? { ...item, duration_seconds: duration } : item
        ));
      }
    }
    setMsg(`บันทึกความยาวสำเร็จ ${saved} เพลง${failed ? ` · ตรวจไม่สำเร็จ ${failed} เพลง` : ''}`);
    setBusy(false);
  }

  // เพิ่มเพลงใหม่
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase || busy) return;

    if (!audio) {
      setMsg('กรุณาเลือกไฟล์เสียง');
      return;
    }

    setBusy(true);
    setMsg('กำลังอัปโหลดไฟล์เพลง...');

    try {
      const durationSeconds = await readAudioDuration(audio);
      const audioPath = `${Date.now()}-${audio.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      const audioUpload = await supabase.storage
        .from('tdh48-audio')
        .upload(audioPath, audio);

      if (audioUpload.error) {
        throw audioUpload.error;
      }

      const audioUrl = supabase.storage
        .from('tdh48-audio')
        .getPublicUrl(audioPath).data.publicUrl;

      let coverUrl: string | null = null;

      if (cover) {
        setMsg('กำลังอัปโหลดภาพปก...');

        const coverPath = `${Date.now()}-${cover.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        const coverUpload = await supabase.storage
          .from('tdh48-covers')
          .upload(coverPath, cover);

        if (coverUpload.error) {
          throw coverUpload.error;
        }

        coverUrl = supabase.storage
          .from('tdh48-covers')
          .getPublicUrl(coverPath).data.publicUrl;
      }

      setMsg('กำลังบันทึกข้อมูลเพลง...');

      const { error } = await supabase
        .from('tracks')
        .insert({
          title,
          artist,
          category,
          album: album || null,
          audio_url: audioUrl,
          cover_url: coverUrl,
          duration_seconds: durationSeconds,
          is_featured: featured,
          published: true,
        });

      if (error) {
        throw error;
      }

      setMsg('เพิ่มเพลงเรียบร้อยแล้ว');

      setTitle('');
      setArtist('TDH48');
      setCategory('Single');
      setAlbum('');
      setAudio(null);
      setCover(null);
      setFeatured(false);

      const form = document.getElementById('add-track-form') as HTMLFormElement | null;
      form?.reset();

      await load();

    } catch (error) {
      console.error('Add track error:', error);

      setMsg(
        error instanceof Error
          ? error.message
          : 'เกิดข้อผิดพลาดในการเพิ่มเพลง'
      );
    } finally {
      setBusy(false);
    }
  }

  // เปิดหน้าต่างแก้ไขข้อมูลเพลงเดิม
  function edit(t: Track) {
    if (!supabase || busy || editBusy) return;
    setEditingTrack(t);
    setEditTitle(t.title || '');
    setEditArtist(t.artist || '');
    setEditCategory(t.category || 'Single');
    setEditAlbum(t.album || '');
    setEditReleaseDate(t.release_date || '');
    setEditFeatured(Boolean(t.is_featured));
    setEditPublished(t.published !== false);
    setEditLyricsText(t.lyrics || '');
    setEditAudio(null);
    setEditCover(null);
    setRemoveEditCover(false);
    setEditConfirm(null);
  }

  async function saveEdit() {
    if (!supabase || !editingTrack || editBusy) return;
    if (!editTitle.trim()) {
      setMsg('กรุณาระบุชื่อเพลง');
      setEditConfirm(null);
      return;
    }

    setEditBusy(true);
    setMsg('กำลังบันทึกการแก้ไขเพลง...');
    try {
      let audioUrl = editingTrack.audio_url;
      let durationSeconds = editingTrack.duration_seconds ?? null;
      let coverUrl = removeEditCover ? null : editingTrack.cover_url;

      if (editAudio) {
        const duration = await readAudioDuration(editAudio);
        const audioPath = `${Date.now()}-${editAudio.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const upload = await supabase.storage.from('tdh48-audio').upload(audioPath, editAudio);
        if (upload.error) throw upload.error;
        audioUrl = supabase.storage.from('tdh48-audio').getPublicUrl(audioPath).data.publicUrl;
        durationSeconds = duration;
      }

      if (editCover) {
        const coverPath = `${Date.now()}-${editCover.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const upload = await supabase.storage.from('tdh48-covers').upload(coverPath, editCover);
        if (upload.error) throw upload.error;
        coverUrl = supabase.storage.from('tdh48-covers').getPublicUrl(coverPath).data.publicUrl;
      }

      const { error } = await supabase.from('tracks').update({
        title: editTitle.trim(),
        artist: editArtist.trim() || 'TDH48',
        category: editCategory,
        album: editAlbum.trim() || null,
        release_date: editReleaseDate || null,
        audio_url: audioUrl,
        cover_url: coverUrl,
        duration_seconds: durationSeconds,
        is_featured: editFeatured,
        published: editPublished,
        lyrics: editLyricsText.trim() || null,
      }).eq('id', editingTrack.id);

      if (error) throw error;

      setMsg('บันทึกการแก้ไขเพลงเรียบร้อยแล้ว');
      setEditingTrack(null);
      setEditConfirm(null);
      await load();
    } catch (error) {
      console.error('Edit track error:', error);
      setMsg(error instanceof Error ? error.message : 'บันทึกการแก้ไขเพลงไม่สำเร็จ');
      setEditConfirm(null);
    } finally {
      setEditBusy(false);
    }
  }

  function requestCancelEdit() {
    if (editBusy) return;
    setEditConfirm('cancel');
  }

  async function editLyrics(t: Track) {
    if (!supabase || busy) return;
    const lyrics = prompt(
      'วางเนื้อเพลงแบบซิงก์เวลา (LRC) ทีละบรรทัด เช่น [00:12.50]ท่อนแรก\\n[00:16.20]ท่อนถัดไป\\nใส่เวลา [นาที:วินาที.เศษวินาที] ไว้หน้าทุกบรรทัด หากไม่มีเวลา ระบบจะแสดงเป็นข้อความธรรมดา',
      t.lyrics || ''
    );
    if (lyrics === null) return;
    setBusy(true);
    const { error } = await supabase.from('tracks').update({ lyrics: lyrics.trim() || null }).eq('id', t.id);
    if (error) setMsg(error.message);
    else {
      setTracks(current => current.map(item => item.id === t.id ? { ...item, lyrics: lyrics.trim() || null } : item));
      setMsg('บันทึกเนื้อเพลงแล้ว');
    }
    setBusy(false);
  }

  // เปิดหรือปิดสถานะเพลงแนะนำ
  async function toggleFeatured(t: Track, checked: boolean) {
    if (!supabase || busy) return;

    setBusy(true);
    setMsg('กำลังบันทึกสถานะเพลงแนะนำ...');

    try {
      const { error } = await supabase
        .from('tracks')
        .update({ is_featured: checked })
        .eq('id', t.id);

      if (error) throw error;

      setTracks((current) =>
        current.map((item) =>
          item.id === t.id
            ? { ...item, is_featured: checked }
            : item
        )
      );

      setMsg(
        checked
          ? `เพิ่ม “${t.title}” ในเพลงแนะนำแล้ว`
          : `นำ “${t.title}” ออกจากเพลงแนะนำแล้ว`
      );
    } catch (error) {
      setMsg(
        error instanceof Error
          ? error.message
          : 'เปลี่ยนสถานะเพลงแนะนำไม่สำเร็จ'
      );
    } finally {
      setBusy(false);
    }
  }

  // ลบเพลง
  async function remove(t: Track) {
    if (!supabase || busy) return;

    const confirmed = confirm(`ลบเพลง “${t.title}” ใช่หรือไม่?`);

    if (!confirmed) return;

    setBusy(true);

    try {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', t.id);

      if (error) throw error;

      setMsg('ลบเพลงเรียบร้อยแล้ว');
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : 'ลบเพลงไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  // ออกจากระบบ
  async function logout() {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMsg(error.message);
      return;
    }

    window.location.href = '/admin/login';
  }

  const featuredCount = tracks.filter((t) => t.is_featured).length;

  return (
    <main className="min-h-screen pb-16">

      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">

          <a href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-fuchsia-200 text-purple-950">
              <Music2 />
            </div>

            <div>
              <b>TDH48 ADMIN</b>
              <div className="text-xs text-white/40">
                Music Management
              </div>
            </div>
          </a>

          <div className="flex gap-3">

            <a
              href="/"
              className="rounded-xl border border-white/10 px-3 py-2 text-xs"
            >
              <ExternalLink className="mr-1 inline" size={14} />
              ดูหน้าเว็บ
            </a>

            <button
              onClick={logout}
              disabled={!supabase}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs disabled:opacity-40"
            >
              <LogOut className="mr-1 inline" size={14} />
              ออกจากระบบ
            </button>

          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-5 py-8">

        <p className="text-xs tracking-[.25em] text-fuchsia-200">
          CONTROL CENTER
        </p>

        <h1 className="mt-2 text-3xl font-black">
          จัดการคลังเพลง
        </h1>

        <p className="mt-2 text-sm text-white/50">
          เพิ่มเพลงใหม่ แก้ไขข้อมูล และดูแลเพลงของ TDH48
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-200/20 bg-fuchsia-200/10 px-4 py-2 text-sm text-fuchsia-100">
          <Star size={15} />
          เพลงแนะนำอยู่ {featuredCount} เพลง
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1.2fr]">

          {/* Add Track Form */}
          <form
            id="add-track-form"
            onSubmit={add}
            className="glass rounded-3xl p-6"
          >

            <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
              <Plus className="text-fuchsia-200" />
              เพิ่มเพลงใหม่
            </h2>

            <label className="text-sm">
              ชื่อเพลง *
            </label>

            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4 mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none"
              placeholder="ชื่อเพลง"
            />

            <label className="text-sm">
              ศิลปิน
            </label>

            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="mb-4 mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none"
            />

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="text-sm">
                  หมวดหมู่
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#21172b] px-3 py-3"
                >
                  <option>Single</option>
                  <option>Album</option>
                  <option>Cover</option>
                  <option>Live</option>
                  <option>Original</option>
                </select>
              </div>

              <div>
                <label className="text-sm">
                  ชื่ออัลบั้ม
                </label>

                <input
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 outline-none"
                />
              </div>

            </div>

            <label className="mt-4 block text-sm">
              ไฟล์เพลง (MP3, WAV, M4A) *
            </label>

            <input
              required
              type="file"
              accept="audio/*"
              onChange={(e) => setAudio(e.target.files?.[0] || null)}
              className="mt-2 w-full text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-200 file:px-3 file:py-2 file:font-bold file:text-purple-950"
            />

            <label className="mt-4 block text-sm">
              ภาพปก (ไม่บังคับ)
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] || null)}
              className="mt-2 w-full text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-200 file:px-3 file:py-2 file:font-bold file:text-purple-950"
            />

            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              ตั้งเป็นเพลงแนะนำ
            </label>

            <button
              disabled={busy || !supabase}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-200 py-3 font-bold text-purple-950 disabled:opacity-50"
            >
              <Upload size={17} />
              {busy ? 'กำลังบันทึก...' : 'อัปโหลดและเพิ่มเพลง'}
            </button>

            {msg && (
              <p className="mt-3 break-words text-sm text-fuchsia-200">
                {msg}
              </p>
            )}

          </form>

          {/* Track List */}
          <section className="glass rounded-3xl p-6">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-xl font-bold">
                เพลงทั้งหมด
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-fuchsia-200/10 px-3 py-1 text-xs text-fuchsia-100">
                  {tracks.length} เพลง
                </span>
                <span className="text-xs text-amber-200">
                  ขาดความยาว {tracks.filter((track) => track.duration_seconds == null).length} เพลง
                </span>
                <button
                  type="button"
                  onClick={fillMissingDurations}
                  disabled={busy || loading || !supabase}
                  className="rounded-xl bg-fuchsia-200 px-4 py-2 text-xs font-bold text-purple-950 disabled:opacity-50"
                >
                  {busy ? 'กำลังตรวจจับ...' : 'เติมความยาวเพลงที่ขาด'}
                </button>
              </div>

            </div>

            {loading ? (

              <p className="text-sm text-white/40">
                กำลังโหลด...
              </p>

            ) : tracks.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
                ยังไม่มีเพลง เริ่มเพิ่มเพลงแรกได้เลย
              </div>

            ) : (

              <div className="space-y-3">

                {tracks.map((t) => (

                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 p-3"
                  >

                    <img
                      src={t.cover_url || '/cover-placeholder.svg'}
                      className="h-12 w-12 rounded-lg object-cover"
                      alt=""
                    />

                    <div className="min-w-0 flex-1">

                      <div className="truncate text-sm font-semibold">
                        {t.title}
                      </div>

                      <div className="text-xs text-white/40">
                        {t.artist} · {t.category} · {t.duration_seconds != null ? `${Math.floor(t.duration_seconds / 60)}:${String(t.duration_seconds % 60).padStart(2, '0')}` : '--:--'}
                      </div>

                      {t.is_featured && (
                        <div className="mt-1 text-[10px] text-fuchsia-200">
                          ★ เพลงแนะนำ
                        </div>
                      )}

                    </div>

                    {/* Checkbox เพลงแนะนำ */}
                    <label
                      title="ตั้งหรือยกเลิกเพลงแนะนำ"
                      className="flex shrink-0 cursor-pointer flex-col items-center gap-1 text-[10px] text-fuchsia-200"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(t.is_featured)}
                        disabled={busy}
                        onChange={(e) => toggleFeatured(t, e.target.checked)}
                        className="h-4 w-4 accent-fuchsia-300"
                      />
                      แนะนำ
                    </label>

                    <button
                      onClick={() => edit(t)}
                      disabled={busy}
                      title="แก้ไขเพลง"
                      className="rounded-lg p-2 text-fuchsia-200 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Pencil size={17} />
                    </button>


                    <button onClick={() => editLyrics(t)} disabled={busy} title="จัดการเนื้อเพลง" className="rounded-lg px-2 py-2 text-xs text-pink-200 hover:bg-white/10 disabled:opacity-40">
                      เนื้อเพลง
                    </button>

                    <button
                      onClick={() => remove(t)}
                      disabled={busy}
                      title="ลบเพลง"
                      className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10 disabled:opacity-40"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>

                ))}

              </div>

            )}

            {msg && (
              <p className="mt-4 break-words text-sm text-fuchsia-200">
                {msg}
              </p>
            )}

          </section>

        </div>

        {editingTrack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-track-title">
            <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-fuchsia-200/20 bg-[#171020] p-5 shadow-2xl sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[.2em] text-fuchsia-200">EDIT TRACK</p>
                  <h2 id="edit-track-title" className="mt-1 text-2xl font-black">แก้ไขข้อมูลเพลง</h2>
                  <p className="mt-1 text-sm text-white/50">แก้ไขเพลงเดิมโดยไม่สร้างรายการเพลงใหม่</p>
                </div>
                <button type="button" onClick={requestCancelEdit} disabled={editBusy} aria-label="ปิดหน้าต่างแก้ไข" className="rounded-xl border border-white/10 p-2 text-white/70 hover:bg-white/10 disabled:opacity-40">
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setEditConfirm('save'); }} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm">ชื่อเพลง *</label>
                    <input required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 outline-none focus:border-fuchsia-200/60" />
                  </div>
                  <div>
                    <label className="text-sm">ศิลปิน</label>
                    <input value={editArtist} onChange={(e) => setEditArtist(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 outline-none focus:border-fuchsia-200/60" />
                  </div>
                  <div>
                    <label className="text-sm">ประเภท / หมวดหมู่</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#21172b] px-3 py-3">
                      <option>Single</option><option>Album</option><option>Cover</option><option>Live</option><option>Original</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">ชื่ออัลบั้ม</label>
                    <input value={editAlbum} onChange={(e) => setEditAlbum(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 outline-none focus:border-fuchsia-200/60" />
                  </div>
                  <div>
                    <label className="text-sm">วันที่เผยแพร่</label>
                    <input type="date" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#21172b] px-3 py-3" />
                  </div>
                  <div className="flex flex-col justify-end gap-3 rounded-xl border border-white/10 p-3">
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editFeatured} onChange={(e) => setEditFeatured(e.target.checked)} className="accent-fuchsia-300" /> เพลงแนะนำ</label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editPublished} onChange={(e) => setEditPublished(e.target.checked)} className="accent-fuchsia-300" /> เผยแพร่บนหน้าเว็บ</label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 p-4">
                    <label className="text-sm font-semibold">ไฟล์เสียงใหม่ (ไม่บังคับ)</label>
                    <p className="mt-1 text-xs text-white/45">หากไม่เลือก ระบบจะใช้ไฟล์เสียงเดิม</p>
                    <input type="file" accept="audio/*" onChange={(e) => setEditAudio(e.target.files?.[0] || null)} className="mt-3 w-full text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-200 file:px-3 file:py-2 file:font-bold file:text-purple-950" />
                    {editAudio && <p className="mt-2 break-all text-xs text-fuchsia-200">เลือกแล้ว: {editAudio.name}</p>}
                  </div>
                  <div className="rounded-xl border border-white/10 p-4">
                    <label className="text-sm font-semibold">ภาพปกใหม่ (ไม่บังคับ)</label>
                    <p className="mt-1 text-xs text-white/45">หากไม่เลือก ระบบจะใช้ภาพปกเดิม</p>
                    <input type="file" accept="image/*" onChange={(e) => { setEditCover(e.target.files?.[0] || null); setRemoveEditCover(false); }} className="mt-3 w-full text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-200 file:px-3 file:py-2 file:font-bold file:text-purple-950" />
                    {editingTrack.cover_url && <label className="mt-3 flex items-center gap-2 text-xs text-rose-200"><input type="checkbox" checked={removeEditCover} onChange={(e) => { setRemoveEditCover(e.target.checked); if (e.target.checked) setEditCover(null); }} /> ลบภาพปกเดิม</label>}
                    {editCover && <p className="mt-2 break-all text-xs text-fuchsia-200">เลือกแล้ว: {editCover.name}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm">เนื้อเพลง / เนื้อเพลงแบบ LRC</label>
                  <textarea rows={6} value={editLyricsText} onChange={(e) => setEditLyricsText(e.target.value)} placeholder="[00:12.50]ตัวอย่างเนื้อเพลง" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 outline-none focus:border-fuchsia-200/60" />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={requestCancelEdit} disabled={editBusy} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5 disabled:opacity-40">× ยกเลิก / ปิด</button>
                  <button type="submit" disabled={editBusy} className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia-200 px-5 py-3 text-sm font-bold text-purple-950 disabled:opacity-50"><Upload size={16} /> บันทึกการแก้ไข</button>
                </div>
              </form>
            </section>
          </div>
        )}

        {editConfirm && editingTrack && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
            <section className="w-full max-w-md rounded-2xl border border-fuchsia-200/20 bg-[#21172b] p-6 shadow-2xl">
              <h3 className="text-lg font-bold">{editConfirm === 'save' ? 'ยืนยันการบันทึก?' : 'ยืนยันการยกเลิก?'}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {editConfirm === 'save'
                  ? `ต้องการบันทึกการเปลี่ยนแปลงของเพลง “${editTitle.trim() || editingTrack.title}” ใช่หรือไม่?`
                  : 'ต้องการยกเลิกการแก้ไขหรือไม่? ข้อมูลที่แก้ไว้แต่ยังไม่บันทึกจะหายไป'}
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setEditConfirm(null)} disabled={editBusy} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5">ไม่ใช่ / กลับไปแก้ไข</button>
                <button type="button" onClick={() => editConfirm === 'save' ? void saveEdit() : (setEditingTrack(null), setEditConfirm(null))} disabled={editBusy} className={`rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50 ${editConfirm === 'save' ? 'bg-fuchsia-200 text-purple-950' : 'bg-rose-300 text-rose-950'}`}>
                  {editBusy ? 'กำลังดำเนินการ...' : editConfirm === 'save' ? 'ยืนยันบันทึก' : 'ยืนยันยกเลิก'}
                </button>
              </div>
            </section>
          </div>
        )}

        <OfficialPlaylistsAdmin />
      </div>
    </main>
  );
}
