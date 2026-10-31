
'use client';

import { useState } from 'react';

type MusicPromoPopupProps = {
  onPlay: () => void;
};

export default function MusicPromoPopup({ onPlay }: MusicPromoPopupProps) {
  const [open, setOpen] = useState(false);

  function handlePlayClick() {
    setOpen(true);
  }

  function handleContinue() {
    setOpen(false);
    onPlay();
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePlayClick}
        className="rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700"
      >
        ▶ Play
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="music-popup-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="ปิดป๊อปอัป"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
            >
              ×
            </button>

            <div className="mb-3 text-4xl">🎧</div>

            <h2
              id="music-popup-title"
              className="mb-3 text-xl font-bold text-pink-600"
            >
              TDH48 Music Player
            </h2>

            <p className="mb-6 text-gray-600">
              ขอบคุณที่เข้ามาฟังเพลงกับ TDH48 💖
            </p>

            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-xl bg-pink-600 px-4 py-3 font-bold text-white hover:bg-pink-700"
            >
              ▶ ฟังเพลงเลย
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-600 hover:bg-gray-50"
            >
              ไว้ทีหลัง
            </button>
          </div>
        </div>
      )}
    </>
  );
}
