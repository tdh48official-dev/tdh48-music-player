  return (
    <main className="min-h-screen bg-[#090909] pb-36 text-white">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-pink-400/10 bg-[#090909]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-7">

          <a href="/" className="flex items-center gap-3">
            <img
              src="/tdh48-logo.png"
              alt="TDH48 Logo"
              className="h-12 w-12 shrink-0 rounded-full border-2 border-pink-400/70 object-cover shadow-lg shadow-pink-500/20"
            />

            <div>
              <div className="font-black tracking-[.15em] text-pink-100">
                TDH48
              </div>

              <div className="text-[9px] tracking-[.3em] text-pink-300/60">
                MUSIC PLAYER
              </div>
            </div>
          </a>

          {/* Search Desktop */}
          <div className="hidden max-w-md flex-1 items-center gap-3 rounded-full border border-pink-300/10 bg-white/5 px-5 py-3 md:flex">
            <Search size={18} className="text-pink-300/60" />

            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSelectedTrack(null);
              }}
              placeholder="ค้นหาเพลงหรือศิลปิน..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </div>

          <div className="flex items-center gap-2">
          <a href="/playlists" className="rounded-full border border-pink-300/20 px-4 py-2 text-xs text-pink-100/80 transition hover:bg-pink-400/10">เพลย์ลิสต์</a>
          {/* Admin */}
          <a
            href="/admin/login"
            className="flex items-center gap-2 rounded-full border border-pink-300/20 px-4 py-2 text-xs text-pink-100/80 transition hover:border-pink-300/50 hover:bg-pink-400/10 hover:text-pink-200"
          >
            <ShieldCheck size={15} />
            Admin
          </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-7">

        {/* หน้ารายละเอียดเพลง */}
        {selectedTrack ? (
          <section>

            <button
              onClick={() => setSelectedTrack(null)}
              className="mb-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-pink-400/20 hover:text-pink-200"
            >
              <ArrowLeft size={18} />
              ย้อนกลับ
            </button>

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#6b354f] to-[#20121c] p-5 md:p-10">
              <div className="relative z-10 flex flex-col items-center gap-7 md:flex-row md:items-end">

                <img
                  src={selectedTrack.cover_url || '/cover-placeholder.svg'}
                  alt={selectedTrack.title}
                  className="aspect-square w-56 rounded-xl object-cover shadow-2xl md:w-72"
                />

                <div className="min-w-0 flex-1 text-center md:text-left">
                  <div className="mb-3 text-sm font-semibold text-pink-200">
                    {selectedTrack.album ? 'อัลบั้ม' : 'ซิงเกิล'}
                  </div>

                  <h1 className="break-words text-3xl font-black md:text-6xl">
                    {selectedTrack.album || selectedTrack.title}
                  </h1>

                  <div className="mt-5 text-sm text-white/70">
                    <span className="font-semibold text-white">
                      {selectedTrack.artist}
                    </span>

                    {selectedTrack.album && (
                      <span> · {selectedTrack.title}</span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-white/50">
                    {selectedTrack.category}
                    {selectedTrack.release_date &&
                      ` · ${formatDate(selectedTrack.release_date)}`}
                    {` · ${detailTracks.length} เพลง`}
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่มเล่นอัลบั้ม */}
            <div className="my-7 flex items-center gap-5">
              <button
                onClick={() => playTrack(selectedTrack, detailTracks)}
                className="grid h-16 w-16 place-items-center rounded-full bg-pink-400 text-[#260d1b] shadow-xl shadow-pink-500/25 transition hover:scale-110 hover:bg-pink-300 active:scale-95"
                aria-label="เล่นเพลง"
              >
                <Play size={29} fill="currentColor" />
              </button>

              <div>
                <div className="text-sm font-bold">
                  รายการเพลง
                </div>

                <div className="text-xs text-pink-200/40">
                  TDH48 Music Library
                </div>
              </div>
            </div>

            {/* รายการเพลง */}
            <div className="border-b border-white/10 pb-3 text-xs text-white/40">
              <div className="grid grid-cols-[35px_1fr_55px] px-4">
                <span>#</span>
                <span>ชื่อเพลง</span>
                <span className="text-right">เวลา</span>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {detailTracks.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => playTrack(item, detailTracks)}
                  className={`grid w-full grid-cols-[35px_1fr_55px] items-center rounded-xl px-4 py-4 text-left transition hover:bg-pink-400/10 ${
                    track?.id === item.id ? 'bg-pink-400/10' : ''
                  }`}
                >
                  <span className="text-sm text-pink-300">
                    {track?.id === item.id && playing ? '♫' : index + 1}
                  </span>

                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-semibold ${
                      track?.id === item.id ? 'text-pink-300' : 'text-white'
                    }`}>
                      {item.title}
                    </span>

                    <span className="block truncate text-xs text-white/45">
                      {item.artist}
                    </span>
                  </span>

                  <span className="text-right text-xs text-white/40">
                    {item.duration_seconds
                      ? `${Math.floor(item.duration_seconds / 60)}:${String(
                          item.duration_seconds % 60
                        ).padStart(2, '0')}`
                      : '--:--'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* Featured Music Slider */}
            {featured && (
              <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#51263e] to-[#161016]">

                <div className="absolute inset-0">
                  <img
                    key={`background-${featured.id}`}
                    src={featured.cover_url || '/cover-placeholder.svg'}
                    alt=""
                    className="h-full w-full object-cover opacity-20 blur-2xl"
                  />

                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />
                </div>

                <div className="relative flex min-h-[360px] flex-col items-center gap-7 p-6 md:min-h-[390px] md:flex-row md:p-12">

                  <img
