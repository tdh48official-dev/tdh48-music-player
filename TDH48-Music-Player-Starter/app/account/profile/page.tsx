'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Camera, LogOut, Save, UserRound } from 'lucide-react';

export default function ProfileSettingsPage() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace('/'); return; }
      const { data } = await supabase.from('profiles').select('display_name,avatar_url').eq('id', user.id).maybeSingle();
      if (!active) return;
      setUserId(user.id);
      setEmail(user.email || '');
      setName(data?.display_name || String(user.user_metadata?.display_name || ''));
      setAvatarUrl(data?.avatar_url || '');
      setBusy(false);
    })();
    return () => { active = false; };
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      let nextAvatar = avatarUrl;
      if (photo) {
        const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${userId}/avatar-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('tdh48-avatars').upload(path, photo, { upsert: true, contentType: photo.type });
        if (uploadError) throw uploadError;
        nextAvatar = supabase.storage.from('tdh48-avatars').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('profiles').update({ display_name: name.trim(), avatar_url: nextAvatar }).eq('id', userId);
      if (error) throw error;
      setAvatarUrl(nextAvatar);
      setPhoto(null);
      setMessage('บันทึกโปรไฟล์เรียบร้อยแล้ว');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ไม่สามารถบันทึกโปรไฟล์ได้');
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.replace('/');
  }

  if (busy) return <main className="grid min-h-screen place-items-center bg-[#fff7fb] text-[#654458]">กำลังโหลดโปรไฟล์...</main>;

  return <main className="min-h-screen bg-[#fff7fb] px-4 py-10 text-[#654458]">
    <section className="mx-auto max-w-xl rounded-[28px] border border-[#f1d9e4] bg-white p-6 shadow-xl shadow-pink-100/60 sm:p-9">
      <header className="mb-8 flex items-center justify-between">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#a34f78]"><ArrowLeft size={17}/> กลับหน้าหลัก</a>
        <button onClick={signOut} className="inline-flex items-center gap-2 text-sm text-[#b58ca0] hover:text-[#9c5275]"><LogOut size={16}/> ออกจากระบบ</button>
      </header>
      <div className="mb-7 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fce6f0] text-[#a34f78]"><UserRound/></span><div><h1 className="text-2xl font-black">ตั้งค่าโปรไฟล์</h1><p className="text-sm text-[#b58ca0]">จัดการชื่อและรูปโปรไฟล์ส่วนตัว</p></div></div>
      <form onSubmit={saveProfile} className="space-y-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#fff8fb] p-6">
          <div className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#fce6f0] text-[#bd7597] shadow-md">
            {photo ? <img src={URL.createObjectURL(photo)} alt="ตัวอย่างรูปโปรไฟล์" className="h-full w-full object-cover"/> : avatarUrl ? <img src={avatarUrl} alt="รูปโปรไฟล์ปัจจุบัน" className="h-full w-full object-cover"/> : <UserRound size={42}/>}
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#f0d5e2] bg-white px-4 py-2 text-sm font-semibold text-[#a34f78] hover:bg-[#fff0f6]"><Camera size={16}/> เปลี่ยนรูปโปรไฟล์<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e=>{const file=e.target.files?.[0]||null;if(file&&file.size>5*1024*1024){setMessage('รูปภาพต้องมีขนาดไม่เกิน 5 MB');return;}setPhoto(file);setMessage('');}}/></label>
          <p className="text-xs text-[#b58ca0]">รองรับ JPG, PNG, WebP ขนาดไม่เกิน 5 MB</p>
        </div>
        <label className="block text-sm font-semibold">ชื่อที่แสดง<input value={name} onChange={e=>setName(e.target.value)} required maxLength={60} placeholder="ชื่อที่ต้องการให้แสดง" className="mt-2 w-full rounded-xl border border-[#f0d5e2] bg-[#fffafd] px-4 py-3 outline-none focus:border-[#df80aa]"/></label>
        <div><p className="mb-1 text-sm font-semibold">อีเมลบัญชี</p><p className="rounded-xl border border-[#f5e4eb] bg-[#fff8fb] px-4 py-3 text-sm text-[#a87991]">{email}</p><p className="mt-1 text-xs text-[#b58ca0]">อีเมลใช้สำหรับเข้าสู่ระบบและไม่สามารถแก้ไขได้ที่หน้านี้</p></div>
        <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#df80aa] py-3 font-bold text-white shadow-md shadow-pink-200 disabled:opacity-50"><Save size={17}/>{saving?'กำลังบันทึก...':'บันทึกโปรไฟล์'}</button>
      </form>
      {message&&<p role="status" className="mt-4 rounded-xl bg-[#fff0f6] p-3 text-sm text-[#9c5275]">{message}</p>}
    </section>
  </main>;
}
