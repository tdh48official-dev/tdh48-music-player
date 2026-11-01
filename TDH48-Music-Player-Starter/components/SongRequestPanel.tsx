'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Track } from '@/lib/types';

type RequestRow = { id:string; requested_title:string|null; requested_artist:string|null; status:string; created_at:string; track: {title:string;artist:string}|null };

export default function SongRequestPanel({ tracks }: { tracks: Track[] }) {
  const supabase = createClient();
  const [user,setUser] = useState<any>(null);
  const [trackId,setTrackId] = useState('');
  const [title,setTitle] = useState('');
  const [artist,setArtist] = useState('');
  const [message,setMessage] = useState('');
  const [requests,setRequests] = useState<RequestRow[]>([]);
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);

  async function load(userId:string) {
    const {data,error} = await supabase.from('song_requests').select('id,requested_title,requested_artist,status,created_at,tracks(title,artist)').eq('user_id',userId).order('created_at',{ascending:false}).limit(10);
    if(error){setNotice(error.message);return;}
    setRequests((data||[]) as unknown as RequestRow[]);
  }
  useEffect(()=>{let alive=true;(async()=>{const {data}=await supabase.auth.getUser();if(!alive)return;setUser(data.user);if(data.user)await load(data.user.id)})();return()=>{alive=false}},[]);
  async function submit(e:React.FormEvent){e.preventDefault();if(!user){setNotice('กรุณาเข้าสู่ระบบก่อนส่งรีเควสเพลง');return;}if(!trackId&&!title.trim()){setNotice('เลือกเพลงหรือกรอกชื่อเพลงที่ต้องการ');return;}setBusy(true);setNotice('');const {error}=await supabase.from('song_requests').insert({user_id:user.id,track_id:trackId||null,requested_title:trackId?null:title.trim(),requested_artist:trackId?null:artist.trim()||null,message:message.trim()||null});if(error)setNotice(error.message);else{setNotice('ส่งรีเควสเพลงเรียบร้อยแล้ว');setTrackId('');setTitle('');setArtist('');setMessage('');await load(user.id)}setBusy(false)}
  return <section className="mt-10 grid gap-5 rounded-3xl border border-pink-300/15 bg-white/[0.035] p-5 md:grid-cols-[1fr_1fr] md:p-7">
    <div><p className="text-xs font-bold tracking-[.2em] text-pink-300">FAN REQUEST</p><h2 className="mt-2 text-xl font-black">รีเควสเพลง / ขอเพิ่มคิว</h2><p className="mt-2 text-sm text-white/45">ส่งคำขอเพลงให้ทีมงานพิจารณา สมาชิกต้องเข้าสู่ระบบก่อน</p>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <select value={trackId} onChange={e=>setTrackId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#211721] px-3 py-3 text-sm"><option value="">เลือกเพลงจากคลัง (หรือกรอกเพลงอื่นด้านล่าง)</option>{tracks.map(t=><option key={t.id} value={t.id}>{t.title} · {t.artist}</option>)}</select>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="ชื่อเพลงที่ไม่มีในคลัง" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"/>
        <input value={artist} onChange={e=>setArtist(e.target.value)} placeholder="ศิลปิน (ถ้ามี)" className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"/>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="ข้อความเพิ่มเติม (ไม่บังคับ)" rows={2} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"/>
        <button disabled={busy} className="rounded-full bg-pink-400 px-6 py-3 text-sm font-bold text-[#260d1b] disabled:opacity-50">{busy?'กำลังส่ง...':'ส่งรีเควสเพลง'}</button>
        {notice&&<p className="text-xs text-pink-200">{notice}</p>}
      </form>
    </div>
    <div><h3 className="font-bold">รีเควสของฉัน</h3>{!user?<p className="mt-3 text-sm text-white/40">เข้าสู่ระบบเพื่อส่งและติดตามรีเควส</p>:requests.length===0?<p className="mt-3 text-sm text-white/40">ยังไม่มีรายการรีเควส</p>:<div className="mt-3 space-y-2">{requests.map(r=><div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><div className="min-w-0"><b className="block truncate text-sm">{r.track?.title||r.requested_title}</b><span className="text-xs text-white/40">{r.track?.artist||r.requested_artist||'ไม่ระบุศิลปิน'}</span></div><span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[10px] text-pink-200">{({pending:'รอตรวจสอบ',approved:'อนุมัติ',rejected:'ไม่อนุมัติ',played:'เล่นแล้ว'} as Record<string,string>)[r.status]||r.status}</span></div>)}</div>}</div>
  </section>;
}
