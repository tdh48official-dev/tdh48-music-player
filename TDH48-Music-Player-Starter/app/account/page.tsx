'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Music2, Mail, LockKeyhole, Chrome } from 'lucide-react';

export default function AccountPage() {
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const supabase=createClient();
      if(mode==='signup') {
        const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{display_name:name.trim()}}});
        if(error) throw error;
        if(data.session) window.location.replace('/account/library');
        else setMessage('สมัครสมาชิกแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีก่อนเข้าสู่ระบบ');
      } else {
        const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
        if(error) throw error;
        window.location.replace('/account/library');
      }
    } catch(err) { setMessage(err instanceof Error?err.message:'เกิดข้อผิดพลาด กรุณาลองใหม่'); }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setMessage('');
    const {error}=await createClient().auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/auth/callback?next=/account/library'}});
    if(error){setMessage(error.message);setBusy(false);}
  }
  async function reset() {
    if(!email.trim()){setMessage('กรุณากรอกอีเมลก่อนขอรีเซ็ตรหัสผ่าน');return;}
    const {error}=await createClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+'/account/reset-password'});
    setMessage(error?error.message:'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว');
  }

  return <main className="grid min-h-screen place-items-center bg-[#fff7fb] px-4 py-10 text-[#654458]">
    <section className="w-full max-w-md rounded-[28px] border border-[#f1d9e4] bg-white p-7 shadow-xl shadow-pink-100/70 sm:p-9">
      <a href="/" className="mb-7 inline-flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fce6f0] text-[#a34f78]"><Music2/></span><span><b className="block tracking-[.2em] text-[#9c5275]">TDH48 MUSIC</b><small className="text-[#bd91a6]">MEMBER ACCOUNT</small></span></a>
      <h1 className="text-2xl font-black">{mode==='login'?'เข้าสู่ระบบสมาชิก':'สร้างบัญชีสมาชิก'}</h1>
      <p className="mt-2 text-sm text-[#a87991]">บันทึกเพลงที่ถูกใจและเพลย์ลิสต์ไว้กับบัญชีของคุณ</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode==='signup'&&<label className="block text-sm">ชื่อที่แสดง<input required value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#f0d5e2] bg-[#fffafd] px-4 py-3 outline-none focus:border-[#df80aa]" placeholder="ชื่อของคุณ"/></label>}
        <label className="block text-sm">อีเมล<span className="mt-2 flex items-center gap-2 rounded-xl border border-[#f0d5e2] bg-[#fffafd] px-4"><Mail size={17} className="text-[#c58ca7]"/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder="you@example.com"/></span></label>
        <label className="block text-sm">รหัสผ่าน<span className="mt-2 flex items-center gap-2 rounded-xl border border-[#f0d5e2] bg-[#fffafd] px-4"><LockKeyhole size={17} className="text-[#c58ca7]"/><input required minLength={8} type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} className="min-w-0 flex-1 bg-transparent py-3 outline-none" placeholder="อย่างน้อย 8 ตัวอักษร"/></span></label>
        <button disabled={busy} className="w-full rounded-xl bg-[#df80aa] py-3 font-bold text-white shadow-md shadow-pink-200 disabled:opacity-50">{busy?'กำลังดำเนินการ...':mode==='login'?'เข้าสู่ระบบ':'สมัครสมาชิก'}</button>
      </form>
      {mode==='login'&&<button onClick={reset} className="mt-3 w-full text-sm text-[#a87991] hover:text-[#9c5275]">ลืมรหัสผ่าน?</button>}
      <div className="my-5 flex items-center gap-3 text-xs text-[#c19aae]"><span className="h-px flex-1 bg-[#f3e3eb]"/>หรือ<span className="h-px flex-1 bg-[#f3e3eb]"/></div>
      <button disabled={busy} onClick={google} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#f0d5e2] bg-white py-3 font-semibold text-[#8f5b75] hover:bg-[#fff6fa]"><Chrome size={18}/> ดำเนินการต่อด้วย Google</button>
      <p className="mt-6 text-center text-sm text-[#a87991]">{mode==='login'?'ยังไม่มีบัญชี?':'มีบัญชีอยู่แล้ว?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('')}} className="font-bold text-[#b85e8a]">{mode==='login'?'สมัครสมาชิก':'เข้าสู่ระบบ'}</button></p>
      {message&&<p role="status" className="mt-4 rounded-xl bg-[#fff0f6] p-3 text-sm text-[#9c5275]">{message}</p>}
      <a href="/" className="mt-6 block text-center text-sm text-[#bd91a6]">← กลับหน้าฟังเพลง</a>
    </section>
  </main>;
}
