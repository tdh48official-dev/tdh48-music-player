
'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Music2, LockKeyhole } from 'lucide-react';

export default function Login() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const supabase = createClient();

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        console.error('Login error:', loginError);
        setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
        return;
      }

      if (!data.user) {
        setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        return;
      }

      // ตรวจสอบว่า Session ถูกบันทึกแล้ว
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        console.error('Session error:', sessionError);
        setError('เข้าสู่ระบบสำเร็จ แต่ไม่พบ Session กรุณาลองใหม่');
        return;
      }

      // ไปหน้า Dashboard
      window.location.replace('/admin');
    } catch (err) {
      console.error('Login exception:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  const urlError = searchParams.get('error');

  const urlErrorMessage =
    urlError === 'not-admin'
      ? 'บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน Dashboard หรือระบบอ่านข้อมูลสิทธิ์แอดมินไม่ได้'
      : urlError === 'unauthorized'
        ? 'กรุณาเข้าสู่ระบบก่อนเข้า Dashboard'
        : urlError === 'config'
          ? 'ระบบยังไม่ได้ตั้งค่า Supabase Environment Variables'
          : '';

  return (
    <main className="grid min-h-screen place-items-center px-5">
      <form
        onSubmit={submit}
        className="glass w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-200 text-purple-950">
          <Music2 />
        </div>

        <p className="text-xs tracking-[.25em] text-fuchsia-200">
          TDH48 MANAGEMENT
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Admin Login
        </h1>

        <p className="mt-2 text-sm text-white/50">
          เข้าสู่ระบบสำหรับทีมผู้ดูแลคลังเพลง
        </p>

        <label className="mt-7 block text-sm">อีเมล</label>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-fuchsia-200"
          placeholder="admin@example.com"
        />

        <label className="mt-4 block text-sm">รหัสผ่าน</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-fuchsia-200"
          placeholder="••••••••"
        />

        {(error || urlErrorMessage) && (
          <p className="mt-3 text-sm text-rose-300">
            {error || urlErrorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-200 py-3 font-bold text-purple-950 disabled:opacity-50"
        >
          <LockKeyhole size={17} />
          {busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบแอดมิน'}
        </button>

        <a
          href="/"
          className="mt-5 block text-center text-sm text-purple-200/60"
        >
          ← กลับหน้าฟังเพลง
        </a>
      </form>
    </main>
  );
}
