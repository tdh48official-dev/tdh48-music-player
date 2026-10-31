
'use client';

type MusicPromoPopupProps = {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
};

export default function MusicPromoPopup({
  open,
  onClose,
  onContinue,
}: MusicPromoPopupProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
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
          onClick={onClose}
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
          onClick={onContinue}
          className="w-full rounded-xl bg-pink-600 px-4 py-3 font-bold text-white hover:bg-pink-700"
        >
          ▶ ฟังเพลงเลย
        </button>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-600 hover:bg-gray-50"
        >
          ไว้ทีหลัง
        </button>
      </div>
    </div>
  );
}
