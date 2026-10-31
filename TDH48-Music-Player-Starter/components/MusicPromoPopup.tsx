
'use client';

import { useState } from 'react';
import { X, Play, Music2, Headphones } from 'lucide-react';

type MusicPromoPopupProps = {
  onPlay: () => void;
};

export default function MusicPromoPopup({
  onPlay,
}: MusicPromoPopupProps) {
  const [open, setOpen] = useState(false);

  function handlePlay() {
    setOpen(true);
  }

  function continuePlaying() {
    setOpen(false);
    onPlay();
  }

  return (
    <>
      {/* ปุ่มเปิด Pop-up ใช้แทนปุ่ม Play เดิม */}
      <button
        type="button"
        onClick={handlePlay}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-fuchsia-300 px-5 py-3 font-bold text-purple-950 transition active:scale-95"
      >
        <Play size={18} fill="currentColor" />
        เล่นเพลง
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tdh48-popup-title"
            className="relative my-auto w-full max-w-sm overflow-hidden rounded-[30px] bg-[#ff91ce] p-5 text-[#182b2b] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="ปิดหน้าต่าง"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/10 p-2"
            >
              <X size={22} />
            </button>

            <header className="pt-3 text-center">
              <p className="text-xs font-black tracking-[0.3em]">
                TDH48 PRESENTS
              </p>

              <h2
                id="tdh48-popup-title"
                className="mt-3 text-4xl font-black leading-none"
              >
                MUSIC
                <br />
                YOU LOVE
              </h2>

              <p className="mt-3 text-sm">
                ค้นพบเพลงโปรดของคุณไปกับ TDH48
              </p>
            </header>

            {/* ภาพโปรโมตจำลอง สร้างด้วย CSS ไม่ต้องใช้ไฟล์ภาพ */}
            <div className="mx-auto my-6 w-52 -rotate-3 rounded-[28px] border-[7px] border-[#173a38] bg-[#092523] p-3 shadow-xl">
              <div className="rounded-2xl bg-gradient-to-br from-[#28514b] to-[#071615] px-3 py-7 text-center text-white">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-pink-300/60 bg-pink-300/10">
                  <Headphones
                    size={34}
                    className="text-pink-300"
                  />
                </div>

                <p className="mt-5 text-xs tracking-[0.3em] text-pink-300">
                  YOUR SOUND
                </p>

                <h3 className="mt-2 text-3xl font-black">
                  TDH48
                </h3>

                <div className="mt-5 flex h-8 items-center justify-center gap-1">
                  {Array.from({ length: 13 }, (_, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-pink-300"
                      style={{
                        height: `${10 + ((i * 17) % 22)}px`,
                      }}
                    />
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/70">
                  <Music2 size={14} />
                  MUSIC FOR EVERY MOMENT
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-black">
                READY TO LISTEN?
              </h3>

              <p className="mt-2 text-sm">
                เพลงที่คุณชอบ รอให้คุณค้นพบ
              </p>

              <button
                type="button"
                onClick={continuePlaying}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173a38] px-4 py-4 font-bold text-white shadow-lg transition active:scale-95"
              >
                <Play size={19} fill="currentColor" />
                ฟังเพลงเลย
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-3 px-4 py-2 text-sm text-black/60"
              >
                ไว้ทีหลัง
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
