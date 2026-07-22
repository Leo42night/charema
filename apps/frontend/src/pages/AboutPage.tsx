// pages/AboutPage.tsx
import { Crown, Database, Play, Star, Trophy, Users } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRecomToMatkul } from "@/hooks/useRecomToMatkul";
import { useLeaderboard, type LeaderboardItem } from "@/hooks/useLeaderboard";
import { RekomResult } from "@/components/RekomResult";
import { TARGET_KRITIK, TARGET_TAGS, userToNim } from "shared";

import { useEffect, useMemo, useRef, useState } from "react";
import githubIcon from "@/assets/github.svg"
import rekapJson from "@/data/rekap.json";
import { BACKEND_URL, TUTORIAL_YT } from "@/constants";
import TooltipAchiev from "@/components/TooltipAchiev";

interface RekapData {
  total_data_latih: number;
  total_matkul: number;
  total_user_nim: number;
  total_sisfo_23: number;
  total_sisfo_24: number;
  total_sisfo_25: number;
  total_siskom_23: number;
  total_siskom_24: number;
  total_siskom_25: number;
  target_users: number;
}

interface UserDetail {
  name: string;
  picture: string;
}

function ChipButton({
  label,
  achieved,
  achievedClass,
  defaultClass,
  popoverText,
}: {
  label: string;
  achieved: boolean;
  achievedClass: string;
  defaultClass: string;
  popoverText: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup popover kalau klik di luar
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`font-space font-black text-xs px-2 py-0.5 border-2 shrink-0 active:scale-95 transition-transform ${achieved ? achievedClass : defaultClass
          }`}
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute z-50 top-full right-0 mt-1 w-40 p-2 border-2 border-black bg-white dark:bg-zinc-900 dark:border-neo-yellow shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#facc15] text-[10px] font-bold text-black dark:text-white"
        >
          {popoverText}
        </div>
      )}
    </div>
  );
}

function LeaderboardList({ leaderboardData }: {
  leaderboardData: LeaderboardItem[];
}) {
  const [expandedKey, setExpandedKey] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<Record<number, UserDetail>>({});
  const [loadingKey, setLoadingKey] = useState<number | null>(null);
  const [errorKey, setErrorKey] = useState<number | null>(null);

  async function handleToggle(userKey: number) {
    // Kalau baris yang sama diklik lagi, tutup accordion
    if (expandedKey === userKey) {
      setExpandedKey(null);
      return;
    }

    setExpandedKey(userKey);

    // Kalau data sudah pernah di-fetch, tidak perlu request ulang
    if (userDetails[userKey]) return;

    setLoadingKey(userKey);
    setErrorKey(null);

    try {
      const res = await axios.get(`${BACKEND_URL}/data/user/${userKey}`);
      const detail: UserDetail = res.data.data; // sesuaikan dengan bentuk response backend

      setUserDetails((prev) => ({ ...prev, [userKey]: detail }));
    } catch (err) {
      setErrorKey(userKey);
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <>
      {leaderboardData.map((user: LeaderboardItem, index: number) => {
        const nim = userToNim[user.user_key] || "TIDAK DIKETAHUI";

        const tagsAchieved = user.total_tags >= TARGET_TAGS;
        const kritikAchieved = user.total_kritik >= TARGET_KRITIK;

        const isExpanded = expandedKey === user.user_key;
        const isLoading = loadingKey === user.user_key;
        const isError = errorKey === user.user_key;
        const detail = userDetails[user.user_key];

        return (
          <div key={index} className="border-2 border-black dark:border-neutral-700">
            {/* Row utama */}
            <div className="flex items-center justify-between p-1.5 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-neo-yellow/10 dark:hover:bg-neo-yellow/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-black text-xs text-neutral-400 dark:text-neutral-500">
                  #{index + 1}
                </span>

                {/* NIM sebagai trigger accordion */}
                <button
                  type="button"
                  onClick={() => handleToggle(user.user_key)}
                  className="font-mono text-[11px] font-black tracking-wide text-black dark:text-white underline decoration-dotted flex items-center gap-1"
                >
                  {nim}
                  <span
                    className={`inline-block transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>
              </div>

              {/* Chips: total_tags, total_kritik, is_scoring */}
              <div className="flex items-center gap-1">
                <ChipButton
                  label={String(user.total_tags)}
                  achieved={tagsAchieved}
                  achievedClass="bg-neo-yellow border-black text-black shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#facc15]"
                  defaultClass="bg-white dark:bg-zinc-800 border-black dark:border-neutral-600 text-black dark:text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)]"
                  popoverText={`Total Tags: ${user.total_tags}/${TARGET_TAGS}${tagsAchieved ? " — Target tercapai! 🎉" : ""
                    }`}
                />

                <ChipButton
                  label={String(4)}
                  achieved={kritikAchieved}
                  achievedClass="bg-blue-500 border-black text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)]"
                  defaultClass="bg-white dark:bg-zinc-800 border-black dark:border-neutral-600 text-black dark:text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)]"
                  popoverText={`Total Kritik: ${user.total_kritik}/${TARGET_KRITIK}${kritikAchieved ? " — Target tercapai! 🎉" : ""
                    }`}
                />

                <ChipButton
                  label={user.is_scoring ? "✓" : "✕"}
                  achieved={user.is_scoring}
                  achievedClass="mt-0.5 bg-green-500 border-black text-white shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)] w-6 h-6 flex items-center justify-center"
                  defaultClass="mt-0.5 bg-white dark:bg-zinc-800 border-black dark:border-neutral-600 text-zinc-400 shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.1)] w-6 h-6 flex items-center justify-center"
                  popoverText={
                    user.is_scoring ? "Sudah memberi rating ⭐" : "Belum memberi rating"
                  }
                />
              </div>
            </div>

            {/* Accordion content */}
            <div
              className={`grid transition-all duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
            >
              <div className="overflow-hidden">
                <div className="p-2 flex items-center gap-3 bg-white dark:bg-zinc-950 border-t-2 border-black dark:border-neutral-700">
                  {isLoading && (
                    <span className="text-xs font-bold text-zinc-400 animate-pulse">
                      Memuat data...
                    </span>
                  )}

                  {isError && (
                    <span className="text-xs font-bold text-red-500">
                      Gagal memuat data user.
                    </span>
                  )}

                  {!isLoading && !isError && detail && (
                    <>
                      <div className="w-12 h-12 shrink-0 border-2 border-black dark:border-neutral-600 overflow-hidden bg-white">
                        {detail.picture ? (
                          <img
                            src={detail.picture}
                            alt={detail.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                            <span className="text-xs font-black text-zinc-500">?</span>
                          </div>
                        )}
                      </div>
                      <span className="font-black text-sm text-black dark:text-white">
                        {detail.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

const AboutPage = () => {
  const selectedMatkulItems = useAuthStore((state) => state.selectedMatkulItems);
  const { leaderboard, isConnected } = useLeaderboard(import.meta.env.VITE_WS_URL);
  const [winner, setWinner] = useState<{
    name: string,
    created_at: string,
    picture: string
  } | null>(null);
  useEffect(() => {
    // console.log("leaderboard", leaderboard);
    // console.log("isConnected", isConnected);
  }, [leaderboard, isConnected]);

  // Fallback aman pakai useMemo, bukan inline
  const safeSelectedItems = useMemo(
    () => selectedMatkulItems ?? [],
    [selectedMatkulItems]
  );
  const recoms = useRecomToMatkul();

  const totalMatkul = recoms ? Object.keys(recoms.matkuls).length : 0;
  const hasData = recoms && totalMatkul > 0;

  // --- Col 2 & 3
  const rekap = rekapJson as RekapData; // map untuk name
  // State untuk menyimpan data statistik backend
  const [stats, setStats] = useState<{
    n_rec_users: number;
    n_feedback: number;
    demographics: Record<string, number>;
    top_10_users: LeaderboardItem[];
    avg_score_chat: number;
    avg_score_cf: number; total_users: number
  }>({
    n_rec_users: 0, n_feedback: 0, demographics: {}, top_10_users: [],
    avg_score_chat: 0, avg_score_cf: 0, total_users: 0
  });
  const hasMounted = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;

    const fetchStats = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/data/stats`); // Sesuaikan endpoint backend Anda
        // console.log("response.data", response.data);
        const scr = response.data.scores_stats;
        setStats({
          n_rec_users: response.data.n_rec_users || 0,
          n_feedback: response.data.n_feedback || 0,
          demographics: response.data.demographics || {},
          top_10_users: response.data.top_10_users || [],
          avg_score_chat: scr.avg_score_chat, avg_score_cf: scr.avg_score_cf,
          total_users: scr.total_users
        });
        setWinner(response.data.winner);
      } catch (error) {
        console.error("Gagal mengambil data statistik:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);
  // ---

  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="px-4 py-6 flex flex-col lg:flex-row lg:items-start lg:justify-center lg:gap-6 max-w-7xl mx-auto">

        {/* --- Kolom Kiri: Rekomendasi --- */}
        {hasData && (
          <div className="mb-6 md:mb-0 w-full md:max-w-xl">
            <RekomResult
              recoms={recoms}
              mode="all"
              selectedMatkulIds={safeSelectedItems}
              showListHeader
            />
          </div>
        )}

        {/* -- Tengah + Kanan jadi flex row di md, kolom di mobile -- */}
        <div className="flex flex-col md:flex-row md:items-start md:gap-4 lg:gap-6 lg:flex-col xl:flex-row w-full lg:max-w-2xl">

          {/* Kolom Tengah */}
          <div className="w-full md:flex-1 font-sans flex flex-col gap-4 text-black dark:text-white mb-6 md:mb-0">

            {/* Header Card */}
            <div className="flex flex-col gap-4">
              {/* Row 1: Jumlah User & Distribusi Prodi */}
              <div className="border-2 border-black dark:border-neo-yellow bg-neo-yellow dark:bg-zinc-800 p-3 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#facc15]">
                <div className="flex items-center gap-3 p-2.5 border-2 border-black bg-neo-white-neutral dark:bg-zinc-800 shadow-neo-yellow dark:shadow-[2px_2px_0_0_#facc15]">
                  {/* Baris 1/Kolom Kiri: Kontainer Ikon Khas (Tetap presisi di samping) */}
                  <div className="p-2 bg-black text-white dark:bg-neo-yellow dark:text-black border-2 border-black shrink-0">
                    <Users className="w-4 h-4 stroke-3" />
                  </div>

                  {/* Kontainer Utama: Hanya memakan 2 baris vertikal */}
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    {/* BARIS 1: Judul Kiri & Persentase Kanan */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-xxs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-300 truncate">
                        Progress <span className="hidden md:inline">Rekomendasi</span> User
                      </span>
                      <span className="font-black text-xs md:text-sm italic text-neutral-800 dark:text-neo-yellow shrink-0">
                        {((stats.n_rec_users / 559) * 100).toFixed(2)}%
                      </span>
                    </div>

                    {/* BARIS 2: Angka Utama Kiri & Keterangan Total Kanan */}
                    <div className="flex justify-between items-baseline gap-2 mt-0.5">
                      <span className="text-xl md:text-2xl font-black font-space leading-none">
                        {stats.n_rec_users} <span className="text-xxs font-bold font-sans opacity-60 ml-0.5">Users</span>
                      </span>
                      <span className="text-xxs font-bold opacity-60 shrink-0 uppercase tracking-tight">
                        Target: {rekap.target_users}
                      </span>
                    </div>
                  </div>
                </div>


                {/* Distribusi Angkatan */}
                <div className="flex flex-col gap-2 border-black dark:border-neutral-600 pt-2 text-[11px]">
                  {/* Header Kolom */}
                  <div className="grid grid-cols-2 gap-2 text-center font-black uppercase text-xxs text-neutral-700 dark:text-neutral-300 mb-1">
                    <div>Sistem Informasi</div>
                    <div className="border-l-2 border-black dark:border-neutral-600 pl-3">Sistem Komputer</div>
                  </div>

                  {/* BARIS 1: Angkatan 2023 */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div className="flex flex-col">
                      <span className="text-xxs font-bold opacity-60">Angkatan 23</span>
                      <span className="font-black text-sm">
                        {stats.demographics?.sisfo23 || 0}{" "}
                        <span className="text-xxs font-normal opacity-60">
                          / {rekap.total_sisfo_23} ({(((stats.demographics?.sisfo23 || 0) / rekap.total_sisfo_23) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col border-l-2 border-black dark:border-neutral-600 pl-3">
                      <span className="text-xxs font-bold opacity-60">Angkatan 23</span>
                      <span className="font-black text-sm">
                        {stats.demographics?.siskom23 || 0}{" "}
                        <span className="text-xxs font-normal opacity-60">
                          / {rekap.total_siskom_23} ({(((stats.demographics?.siskom23 || 0) / rekap.total_siskom_23) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* BARIS 2: Angkatan 2024 */}
                  <div className="grid grid-cols-2 gap-2 items-center border-t border-black/10 dark:border-white/10 pt-1">
                    <div className="flex flex-col">
                      <span className="text-xxs font-bold opacity-60">Angkatan 24</span>
                      <span className="font-black text-sm">
                        {stats.demographics?.sisfo24 || 0}{" "}
                        <span className="text-xxs font-normal opacity-60">
                          / {rekap.total_sisfo_24} ({(((stats.demographics?.sisfo24 || 0) / rekap.total_sisfo_24) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col border-l-2 border-black dark:border-neutral-600 pl-3">
                      <span className="text-xxs font-bold opacity-60">Angkatan 24</span>
                      <span className="font-black text-sm">
                        {stats.demographics?.siskom24 || 0}{" "}
                        <span className="text-xxs font-normal opacity-60">
                          / {rekap.total_siskom_24} ({(((stats.demographics?.siskom24 || 0) / rekap.total_siskom_24) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* BARIS 3: Angkatan 2025 */}
                  <div className="grid grid-cols-2 gap-2 items-center border-t border-black/10 dark:border-white/10 pt-1">
                    <div className="flex flex-col">
                      <span className="text-xxs font-bold opacity-60">Angkatan 25</span>
                      <span className="font-black text-sm">
                        {stats.demographics?.sisfo25 || 0}{" "}
                        <span className="text-xxs font-normal opacity-60">
                          / {rekap.total_sisfo_25} ({(((stats.demographics?.sisfo25 || 0) / rekap.total_sisfo_25) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-col border-l-2 border-black dark:border-neutral-600 pl-3">
                      <span className="text-xxs font-bold opacity-60">Angkatan 25</span>
                      <span className="font-black text-sm">
                        {stats.demographics?.siskom25 || 0}{" "}
                        <span className="text-xxs font-normal opacity-60">
                          / {rekap.total_siskom_25} ({(((stats.demographics?.siskom25 || 0) / rekap.total_siskom_25) * 100).toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Tutorial */}
            <div className="border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#facc15]">
              {/* Label header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-black dark:border-neo-yellow bg-black text-neo-yellow">
                <Play className="w-3 h-3 fill-neo-yellow" />
                <span className="text-xxs font-black uppercase tracking-widest">Tutorial Penggunaan</span>
              </div>
              {/* iframe YouTube */}
              <div className="aspect-video w-full">
                <iframe
                  src={TUTORIAL_YT}
                  title="Tutorial Penggunaan Akademik Bot"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="px-3 py-2 text-xxs font-bold text-neutral-500 dark:text-neutral-400 border-t-2 border-black dark:border-neo-yellow">
                Tonton video di atas untuk memahami cara menggunakan sistem rekomendasi ini secara lengkap.
              </p>
            </div>
          </div>

          {/* Kolom Kanan: Panel Statistik Neobrutalism */}
          <div className="w-full md:w-72 md:shrink-0 lg:w-full xl:w-72 xl:shrink-0 flex flex-col gap-4">

            {/* Baris Baru: GitHub Link (Kolom Kiri) & Total Kritik (Kolom Kanan) */}
            <div className="grid grid-cols-2 gap-3 text-black dark:text-white">

              {/* KOLOM KIRI: GitHub Link Button */}
              <a
                href="https://github.com/Leo42night/charema"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2 bg-white dark:bg-zinc-800 border-2 border-black dark:border-neo-yellow hover:bg-gray-100 dark:hover:bg-zinc-700 transition-all duration-100 shadow-neo-yellow dark:shadow-[2px_2px_0_0_#facc15] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                aria-label="GitHub Repository"
              >
                <img
                  src={githubIcon}
                  alt="GitHub"
                  className="w-3.5 h-3.5 dark:brightness-0"
                />
                <span className="text-xxs font-black uppercase tracking-wide whitespace-nowrap">
                  Detail Proyek
                </span>
              </a>

              {/* KOLOM KANAN: Total Kritik / Feedback */}
              <div className="flex items-center justify-between p-2 bg-neo-yellow dark:bg-zinc-800 border-2 border-black dark:border-neo-yellow shadow-neo-yellow dark:shadow-[2px_2px_0_0_#facc15]">
                <span className="text-xxs font-black uppercase tracking-wide text-neutral-800 dark:text-neutral-300 leading-none">
                  Total Kritik
                </span>
                <span className="font-space font-black text-sm bg-white dark:bg-zinc-900 px-1.5 py-0.5 border border-black leading-none">
                  {loading ? "..." : stats.n_feedback}
                </span>
              </div>

            </div>

            {/* LEADERBOARD: Top 10 Kontributor */}
            <div className="p-4 border-2 border-black dark:border-neo-yellow bg-white dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#facc15] flex flex-col gap-3">
              <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-2">
                <div className="flex items-start gap-1.5">
                  {/* Ikon Trophy disesuaikan sedikit margin atasnya agar sejajar dengan baris pertama */}
                  <Trophy
                    className="w-4 h-4 shrink-0 fill-neo-yellow stroke-black dark:stroke-neo-yellow stroke-[2.5] mt-0.5"
                  />

                  {/* Pembungkus vertikal untuk Judul dan Deskripsi */}
                  <div className="flex flex-col">
                    <span className="text-xxs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-300">
                      Top 10 User
                    </span>
                    {/* Deskripsi Kecil Hadiah */}
                    <span className="text-xxs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5 normal-case">
                      <strong className="font-extrabold underline ">Rp100k</strong> bagi yg pertama selesai misi
                    </span>
                  </div>
                </div>

                <TooltipAchiev />
              </div>

              {/* Winner */}
              {winner &&
                <div className="flex items-center gap-3">
                  {/* Bukti Hadiah */}
                  {/* <a
                    href="https://lh3.googleusercontent.com/a/ACg8ocItZPaKM6xWbFTel2XTVH8DAqzpFaB6jefke-FvIS87qLTgAp4=s96-c"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 group"
                  >
                    <div className="w-14 h-14 border-2 border-black dark:border-neutral-600 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden bg-white relative">
                      <img
                        src="https://lh3.googleusercontent.com/a/ACg8ocItZPaKM6xWbFTel2XTVH8DAqzpFaB6jefke-FvIS87qLTgAp4=s96-c"
                        alt={`Bukti hadiah ${winner.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[7px] font-black uppercase text-center py-0.5">
                        Bukti
                      </div>
                    </div>
                  </a> */}

                  {/* Foto pemenang */}
                  <div className="w-14 h-14 shrink-0 border-2 border-black dark:border-neutral-600 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden bg-white">
                    {winner.picture ? (
                      <img
                        src={winner.picture}
                        alt={winner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                        <span className="text-xs font-black text-zinc-500">?</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex gap-0.5">
                      <Crown
                        className="w-4 h-4 shrink-0 fill-black stroke-black dark:fill-neo-yellow dark:stroke-neo-yellow stroke-[2.5]"
                      />
                      <span className="text-xxs font-black uppercase bg-black text-white dark:bg-neo-yellow dark:text-black px-1.5 py-0.5 border border-black shrink-0">
                        WINNER
                      </span>
                    </div>
                    {/* Nama dan NIM */}
                    <span className="font-black text-sm text-black dark:text-white truncate">
                      {winner.name}
                    </span>
                    <span className="font-mono text-[11px] font-black tracking-wide text-neutral-700 dark:text-neutral-400">
                      {new Date(winner.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              }

              {loading ? (
                <span className="text-xs font-bold animate-pulse text-center py-4">Memuat Peringkat...</span>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-70 overflow-y-auto pr-1 custom-scrollbar">

                  {/* Menggunakan data dari 'leaderboard' WebSocket, jika belum ada pakai 'stats.top_10_users' */}
                  {((leaderboard && leaderboard.length > 0) ? leaderboard : stats.top_10_users) &&
                    ((leaderboard && leaderboard.length > 0) ? leaderboard : stats.top_10_users).length > 0 ? (
                    <LeaderboardList
                      leaderboardData={(leaderboard && leaderboard.length > 0) ? leaderboard : stats.top_10_users}
                    />
                  ) : (
                    <span className="text-xxs font-bold text-zinc-400 text-center py-4">Tidak ada data aktivitas</span>
                  )}
                </div>
              )}
            </div>

            {/* Star CHART: Avg Score CF & FFNN */}
            <div className="p-4 border-2 border-black dark:border-neo-yellow bg-neo-white-neutral dark:bg-zinc-800 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#facc15] flex flex-col gap-3">

              {/* BAGIAN JUDUL: Keterangan Berisi Informasi dan Total Users */}
              <div className="flex flex-col gap-1 border-b-2 border-black dark:border-neutral-700 pb-2">
                <div className="flex justify-between items-start">
                  <span className="text-xxs font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                    Analisis Skor Kepuasan
                  </span>
                  <span className="text-xxs font-black uppercase bg-black text-white dark:bg-neo-yellow dark:text-black px-1.5 py-0.5 border border-black shrink-0">
                    {stats.total_users || 0} Users Terlibat
                  </span>
                </div>
                <p className="text-xxs text-neutral-500 dark:text-neutral-400 normal-case leading-tight">
                  Rata-rata penilaian sistem berdasarkan akumulasi algoritma Collaborative Filtering dan Chatbot.
                </p>
              </div>

              {/* BAGIAN DATA: Membagi Menjadi 2 Kolom Kiri & Kanan */}
              <div className="w-full grid grid-cols-2 gap-3 py-1">
                {loading ? (
                  <div className="col-span-2 text-center py-4 text-xs font-bold animate-pulse">
                    Memuat Data Skor...
                  </div>
                ) : (
                  <>
                    {/* Kolom 1: Average Score Chat */}
                    <div className="p-3 bg-neo-yellow dark:bg-zinc-700 border-2 border-black flex flex-col gap-1 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#facc15]">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-black stroke-black dark:fill-neo-yellow dark:stroke-neo-yellow shrink-0" />
                        <span className="text-xxs font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">
                          Avg Chat Score
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black font-space">
                          {Number(stats.avg_score_chat).toFixed(1)}
                        </span>
                        <span className="text-xxs font-bold text-neutral-500">/ 5.0</span>
                      </div>
                    </div>

                    {/* Kolom 2: Average Score CF */}
                    <div className="p-3 bg-neo-white-neutral dark:bg-zinc-700 border-2 border-black flex flex-col gap-1 shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#000]">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-neo-red stroke-black dark:fill-neo-red dark:stroke-black shrink-0" />
                        <span className="text-xxs font-black uppercase tracking-tight text-neutral-700 dark:text-neutral-300">
                          Avg NCF Score
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black font-space">
                          {Number(stats.avg_score_cf).toFixed(1)}
                        </span>
                        <span className="text-xxs font-bold text-neutral-500">/ 5.0</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Kontainer Static Data Latih */}
            <div className="mb-4 md:mb-0 border-2 border-black dark:border-neo-yellow p-3 bg-white dark:bg-zinc-900 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#facc15]">
              {/* HEADING: Judul & Deskripsi Data Latih */}
              <div className="border-b-2 border-black dark:border-neutral-700 pb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 stroke-3 shrink-0" />
                  <h3 className="text-xs font-black uppercase tracking-wide">
                    Dataset Model Rekomendasi
                  </h3>
                </div>
                <p className="text-xxs font-bold text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  Data diambil dari nilai akademik <span className="font-black text-black dark:text-white">{rekap.total_user_nim.toLocaleString('en-US')} Mahasiswa</span> pada rentang waktu semester <span className="font-black text-black dark:text-white">2021 (Ganjil) – 2025 (Genap)</span>.
                </p>
              </div>

              {/* Bagian 1: Grid Ringkasan (Matkul & Dataset) */}
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <div className="border-2 border-black dark:border-neutral-700 p-2 bg-blue-100 dark:bg-blue-950/40 flex flex-col justify-between shadow-neo-yellow dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]">
                  <span className="text-xxs font-black uppercase opacity-60 leading-none dark:text-blue-300">Jumlah Matkul</span>
                  <span className="text-xl font-black mt-1 leading-none dark:text-blue-400">{rekap.total_matkul}</span>
                </div>
                <div className="border-2 border-black dark:border-neutral-700 p-2 bg-green-100 dark:bg-green-950/40 flex flex-col justify-between shadow-neo-yellow dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]">
                  <span className="text-xxs font-black uppercase opacity-60 leading-none dark:text-green-300">Jumlah Dataset</span>
                  <span className="text-xl font-black mt-1 leading-none dark:text-green-400">{rekap.total_data_latih.toLocaleString("en-US")}</span>
                </div>
              </div>

              {/* Bagian 2: Pengecualian / Data Kosong */}
              <div className="border-2 border-black dark:border-neutral-700 p-2 bg-red-50 dark:bg-red-950/20 shadow-neo-yellow dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.5)] mt-2.5">
                <div className="text-xxs font-black uppercase text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1 leading-none">
                  <span className="inline-block w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full animate-pulse"></span>
                  Rentang Waktu Tidak Tersedia:
                </div>
                <ul className="flex flex-col gap-1 text-xxs font-bold text-neutral-700 dark:text-neutral-300">
                  <li className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-0.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1 py-px bg-black text-white dark:bg-zinc-700 font-black text-[7px] tracking-wide shrink-0">RESISKOM</span>
                      <span>2025 Genap</span>
                    </div>
                    <span className="opacity-50 text-[8px] font-normal">(Januari-Juni)</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1 py-px bg-zinc-600 dark:bg-zinc-500 text-white font-black text-[7px] tracking-wide shrink-0">SISFO</span>
                      <span>2025 Genap</span>
                    </div>
                    <span className="opacity-50 text-[8px] font-normal">(Januari-Juni)</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;