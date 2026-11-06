'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Music2, Mail, LockKeyhole, UserRound } from 'lucide-react';

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
        else setMessage('สมัครเรียบร้อยแล้ว 🎀 กรุณายืนยันผ่านลิงก์ในอีเมล แล้วกลับมาเข้าสู่ระบบ');
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

  const fieldHint = 'mt-1.5 block text-xs font-normal leading-5 text-[#765365]';

  return (
    <main className="grid min-h-screen place-items-center bg-[#fff7fb] px-4 py-10 text-[#563344]">
      <section className="w-full max-w-md rounded-[28px] border border-[#f0d4e1] bg-white p-7 shadow-xl shadow-[#e8b8ce]/25 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#ffd9e8] to-[#f4bfd6] text-[#8b526d]"><Music2 /></span>
          <span><b className="block tracking-[.2em] text-[#9b607b]">TDH48 MUSIC</b><small className="text-[#765365]">MEMBER ACCOUNT</small></span>
        </div>
        <h1 className="text-2xl font-black text-[#422638]">{mode === 'login' ? 'เข้าสู่ระบบสมาชิก' : 'สมัครสมาชิก TDH48'}</h1>
        <p className="mt-2 text-sm leading-6 text-[#765365]">
          {mode === 'login'
            ? 'กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบ หรือเลือกสมัครสมาชิกหากยังไม่มีบัญชี 💗'
            : 'สร้างบัญชีเพื่อบันทึกเพลงโปรดและประวัติการฟังของคุณ 🌸'}
        </p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'signup' && (
            <label className="block text-sm font-semibold text-[#563344]">
              ชื่อที่แสดง
              <span className="mt-2 flex items-center gap-2 rounded-xl border border-[#e8c7d6] bg-[#fff8fc] px-4">
                <UserRound size={17} className="shrink-0 text-[#b76f90]" />
                <input required value={displayName} onChange={event => setDisplayName(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 font-normal text-[#38232e] outline-none placeholder:text-[#a58b98]" placeholder="เช่น ชื่อเล่นหรือชื่อที่ต้องการใช้" />
              </span>
              <small className={fieldHint}>ใช้ชื่อเล่นได้ และเปลี่ยนภายหลังได้</small>
            </label>
          )}
          <label className="block text-sm font-semibold text-[#563344]">
            อีเมล
            <span className="mt-2 flex items-center gap-2 rounded-xl border border-[#e8c7d6] bg-[#fff8fc] px-4">
              <Mail size={17} className="shrink-0 text-[#b76f90]" />
              <input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 font-normal text-[#38232e] outline-none placeholder:text-[#a58b98]" placeholder="you@example.com" />
            </span>
            <small className={fieldHint}>{mode === 'signup' ? 'ใช้อีเมลที่เปิดอ่านได้ เพื่อรับลิงก์ยืนยัน (ตรวจ Spam/Junk หากไม่พบ)' : 'ใช้อีเมลที่ลงทะเบียนไว้'}</small>
          </label>
          <label className="block text-sm font-semibold text-[#563344]">
            รหัสผ่าน
            <span className="mt-2 flex items-center gap-2 rounded-xl border border-[#e8c7d6] bg-[#fff8fc] px-4">
              <LockKeyhole size={17} className="shrink-0 text-[#b76f90]" />
              <input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={event => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent py-3 font-normal text-[#38232e] outline-none placeholder:text-[#a58b98]" placeholder={mode === 'login' ? 'รหัสผ่านที่ตั้งไว้ตอนสมัคร' : 'อย่างน้อย 8 ตัวอักษร'} />
            </span>
            <small className={fieldHint}>{mode === 'signup' ? 'อย่างน้อย 8 ตัวอักษร แนะนำให้ผสมตัวพิมพ์เล็ก-ใหญ่และตัวเลข' : 'กรอกรหัสผ่านที่ใช้สมัครสมาชิก'}</small>
          </label>
          <button disabled={busy} className="w-full rounded-xl bg-[#f4bfd6] py-3 font-bold text-[#563344] transition hover:bg-[#ffe2ef] disabled:opacity-50">{busy ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-[#765365]">
          {mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}{' '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }} className="font-bold text-[#a34f78] underline underline-offset-2 hover:text-[#8b526d]">
            {mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </p>
        {message && <p role="status" className="mt-4 rounded-xl border border-[#dfb3c7] bg-[#fff0f5] p-3 text-sm font-semibold leading-6 text-[#422638]">{message}</p>}
        <p className="mt-6 text-center text-xs text-[#765365]">พื้นที่สมาชิก TDH48 · ใช้อีเมลเพื่อเข้าสู่ระบบ 💗</p>
      </section>
    </main>
  );
}
