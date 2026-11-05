'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Music2, Mail, LockKeyhole } from 'lucide-react';

export default function MemberLogin() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const supabase = createClient();
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw error;
        if (data.session) window.location.reload();
        else setMessage('สมัครสมาชิกแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.reload();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#10091b] px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-[28px] border border-fuchsia-200/15 bg-[#1c112b] p-7 shadow-2xl shadow-fuchsia-950/30 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-200 to-violet-400 text-purple-950"><Music2 /></span>
          <span><b className="block tracking-[.2em] text-fuchsia-100">TDH48 MUSIC</b><small className="text-purple-200/55">MEMBER ACCOUNT</small></span>
        </div>
        <h1 className="text-2xl font-black">{mode === 'login' ? 'เข้าสู่ระบบสมาชิก' : 'สมัครสมาชิก TDH48'}</h1>
        <p className="mt-2 text-sm leading-6 text-purple-100/60">เข้าสู่คลังเพลงและเพลย์ลิสต์ส่วนตัวด้วยอีเมลของคุณ</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'signup' && <label className="block text-sm">ชื่อที่แสดง<input required value={displayName} onChange={event => setDisplayName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-fuchsia-200/60" placeholder="ชื่อของคุณ" /></label>}
          <label className="block text-sm">อีเมล<span className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4"><Mail size={17} className="text-fuchsia-200/70" /><input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder="you@example.com" /></span></label>
          <label className="block text-sm">รหัสผ่าน<span className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4"><LockKeyhole size={17} className="text-fuchsia-200/70" /><input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder="อย่างน้อย 8 ตัวอักษร" /></span></label>
          <button disabled={busy} className="w-full rounded-xl bg-fuchsia-200 py-3 font-bold text-purple-950 transition hover:bg-white disabled:opacity-50">{busy ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-purple-100/60">{mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}{' '}<button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }} className="font-bold text-fuchsia-200 hover:text-white">{mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button></p>
        {message && <p role="status" className="mt-4 rounded-xl border border-fuchsia-200/15 bg-fuchsia-200/10 p-3 text-sm text-fuchsia-100">{message}</p>}
        <p className="mt-6 text-center text-xs text-purple-100/35">เข้าสู่ระบบด้วยอีเมลเท่านั้น · TDH48 MUSIC</p>
      </section>
    </main>
  );
}
