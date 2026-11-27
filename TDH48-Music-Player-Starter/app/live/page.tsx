import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function getYouTubeEmbedUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\\./, '');
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      videoId = url.searchParams.get('v') || '';
      if (!videoId) {
        const parts = url.pathname.split('/').filter(Boolean);
        const marker = parts.findIndex((part) => ['live', 'embed', 'shorts'].includes(part));
        if (marker >= 0) videoId = parts[marker + 1] || '';
      }
    }

    if (!/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) return null;
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
  } catch {
    return null;
  }
}

export default async function LivePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('live_streams')
    .select('is_live, youtube_url, title, description')
    .eq('id', 1)
    .maybeSingle();

  const isLive = Boolean(data?.is_live);
  const embedUrl = isLive ? getYouTubeEmbedUrl(data?.youtube_url || null) : null;

  return (
    <main className="min-h-screen px-5 py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-fuchsia-200 hover:text-white">
          ← กลับหน้า TDH48 Music
        </Link>

        <header className="mt-8 text-center">
          <p className="text-xs tracking-[.35em] text-fuchsia-200">TDH48 OFFICIAL</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">LIVE STREAMING</h1>
          <p className="mt-3 text-sm text-white/55">รับชมการถ่ายทอดสดจาก TDH48 ได้ที่นี่</p>
        </header>

        <section className="glass mt-8 overflow-hidden rounded-3xl p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{data?.title || 'TDH48 LIVE'}</h2>
            <span className={`rounded-full px-4 py-2 text-xs font-bold ${isLive ? 'bg-red-500/15 text-red-300' : 'bg-white/10 text-white/60'}`}>
              {isLive ? '● LIVE NOW' : 'OFFLINE'}
            </span>
          </div>

          {error ? (
            <div className="rounded-2xl border border-white/10 p-8 text-center text-sm text-white/60">
              ยังไม่สามารถโหลดข้อมูล LIVE ได้ในขณะนี้
            </div>
          ) : embedUrl ? (
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe
                src={embedUrl}
                title={data?.title || 'TDH48 LIVE'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 text-center">
              <span className="text-5xl">♫</span>
              <p className="mt-4 text-xl font-bold">ขณะนี้ยังไม่มีการถ่ายทอดสด</p>
              <p className="mt-2 max-w-lg text-sm text-white/45">
                {isLive
                  ? 'ลิงก์ YouTube ยังไม่ถูกต้อง กรุณาติดต่อผู้ดูแลเว็บไซต์'
                  : 'โปรดติดตามประกาศการถ่ายทอดสดครั้งต่อไปจาก TDH48'}
              </p>
            </div>
          )}

          {data?.description && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-white/65">{data.description}</p>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-white/35">TDH48 Music Player · Official Live</p>
      </div>
    </main>
  );
}
