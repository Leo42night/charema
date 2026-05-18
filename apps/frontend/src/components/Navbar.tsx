import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import GoogleIcon from "./GoogleIcon";
import { useUI } from "../context/UIContext";
import { useAuthStore } from "@/stores/useAuthStore";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import Achievement from "./chatbot/Achievement";
import { useUIStore } from "@/stores/useUIStore";
import { useChatPresenter } from "@/presenters/chatbot";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { RatingModal } from "./chatbot/RatingModal";

const NAV_ITEMS = [
  { label: "Chatbot", href: "/" },
  { label: "About", href: "/about" }
];

export default function Navbar() {
  // ==========================================
  // 1. SEMUA HOOK HARUS BERADA DI PALING ATAS
  // ==========================================

  // Zustand & Custom Hooks (Zustand menggunakan useSyncExternalStore di dalamnya)
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isNavbarVisible } = useUI();
  const { msgCount, resetChat, modalScore, setModalScore } = useUIStore();
  const chatPresenter = useChatPresenter();
  const isOnline = useOnlineStatus();

  // Google Auth Hook (Harus selalu dipanggil tanpa bersyarat)
  const { login, isLoading } = useGoogleAuth();

  // State Hooks
  const {menuOpen, setMenuOpen} = useUIStore();
  const [isDark, setIsDark] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Ref Hooks
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const navbarRef = useRef<HTMLElement>(null);

  // Image Handler State (Gunakan fungsi inisialisasi agar fallback tidak di-encode ulang tiap render)
  const [imgSrc, setImgSrc] = useState(() => {
    const fallback = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name || "") + "&background=FFEE00&color=000000&size=128";
    return user?.picture || fallback;
  });

  // ==========================================
  // 2. EFECT HOOKS (SELESAIKAN STATE DI ATAS DULU)
  // ==========================================

  // Efek untuk sinkronisasi gambar avatar saat user berubah
  useEffect(() => {
    const fallback = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user?.name || "") + "&background=FFEE00&color=000000&size=128";
    setImgSrc(user?.picture || fallback);
  }, [user?.picture, user?.name]);

  // Sinkronisasi tema dengan class .dark di <html>
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Handle klik di luar avatar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarContainerRef.current && !avatarContainerRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    }

    if (avatarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [avatarOpen]);

  return (
    <>
      <header
        ref={navbarRef}
        className={`
          ${!isNavbarVisible ? '-translate-y-full opacity-0 pointer-events-none hidden' : 'translate-y-0 opacity-100'}
          sticky top-0 z-50
          h-14 flex items-center justify-between 
          border-b-4 border-black bg-neo-yellow px-4 transition-all
          dark:bg-black dark:border-neo-yellow
        `}>

        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <button
            className="neo-btn flex flex-col gap-1 bg-white dark:bg-transparent p-1.5 shadow-neo-sm sm:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Menu"
          >
            <span className="block h-0.5 w-5 bg-black dark:bg-neo-yellow" />
            <span className="block h-0.5 w-5 bg-black dark:bg-neo-yellow" />
            <span className="block h-0.5 w-5 bg-black dark:bg-neo-yellow" />
          </button>

          {/* Logo */}
          <div className="shrink-0 border-neo border-black bg-black px-2.5 py-1 text-sm font-bold tracking-tighter text-neo-yellow dark:border-neo-yellow sm:text-base">
            BOT//AI
          </div>

          {/* Desktop Links */}
          <ul className="hidden sm:flex items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.label} id={item.label === "About" ? "nav-about" : ""}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `block px-3 py-1 text-[11px] font-bold uppercase border-2.5 border-black transition-all shadow-neo-sm hover:bg-neo-red dark:border-neo-yellow dark:shadow-[2px_2px_0_0_#FFEE00]
                    ${isActive
                      ? "bg-black text-neo-yellow dark:bg-neo-yellow dark:text-black"
                      : "bg-white text-black dark:bg-zinc-900 dark:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="neo-btn flex items-center justify-center h-9 w-9 bg-white shadow-neo-sm dark:bg-zinc-900 dark:border-neo-yellow dark:shadow-[2px_2px_0_0_#FFEE00] transition-all"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <span className="text-neo-yellow text-lg">☼</span>
            ) : (
              <span className="text-black text-lg">☾</span>
            )}
          </button>

          {/* Avatar */}
          <div className="flex items-center gap-2">
            {/* Avatar / Login Section */}
            {user ? (
              <div className="relative" ref={avatarContainerRef}>
                <button
                  className="neo-btn flex items-center gap-1.5 bg-white p-1 pr-2 shadow-neo-sm dark:bg-zinc-900 dark:border-neo-yellow dark:shadow-[2px_2px_0_0_#FFEE00] dark:text-white"
                  onClick={() => setAvatarOpen((v) => !v)}
                >
                  <div className="relative h-7 w-7">
                    {/* Placeholder atau Spinner saat loading */}
                    <img
                      src={imgSrc}
                      alt={user.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-7 w-7 border-2 border-black object-cover"
                    />
                  </div>
                  <span className="hidden sm:block max-w-20 overflow-hidden text-ellipsis whitespace-nowrap text-[11px]">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="text-[10px]">▾</span>
                </button>

                {/* Dropdown Profile */}
                {avatarOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] z-400 min-w-45 border-neo border-black bg-white dark:shadow-neo-yellow shadow-neo animate-in fade-in zoom-in-95 duration-100">
                    <div className="border-b-2 border-black bg-muted/20 p-3 dark:bg-zinc-900">
                      <div className="text-xs font-bold">{user.name}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{user.email}</div>
                    </div>
                    <button
                      className="w-full bg-transparent px-3 py-2.5 text-left text-[11px] font-bold uppercase transition-colors hover:bg-neo-yellow dark:bg-neo-red"
                      onClick={() => {
                        setAvatarOpen(false);
                        logout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className={`neo-btn flex items-center md:gap-2 bg-white px-2 py-1.5 text-[10px] shadow-neo-sm sm:px-3 dark:bg-zinc-900 dark:border-neo-yellow dark:text-white transition-all
                  ${isLoading
                    ? "opacity-60 cursor-not-allowed shadow-none translate-x-0.5 translate-y-0.5"
                    : "hover:bg-neo-red"
                  }`}
                onClick={() => !isLoading && login()} // Cegah klik ganda saat loading
                disabled={isLoading}
              >
                {isLoading ? (
                  // Spinner SVG loading element
                  <svg className="animate-spin h-3 w-3 text-black dark:text-neo-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <GoogleIcon />
                )}

                <span className="uppercase tracking-tight">
                  {isLoading ? "Loading..." : <span className="hidden sm:inline">Login Google</span>}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------------------- */}

      {/* Mobile Drawer Overlay: close jika diluar */}
      <div
        className={`fixed inset-0 z-300 bg-black/50 backdrop-blur-sm transition-opacity ${menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Drawer Content */}
      <aside
        className={`fixed top-0 left-0 z-400 h-dvh w-[75vw] max-w-70 border-r-4 border-black bg-white dark:bg-zinc-900 shadow-[8px_0_0_0_#000] transition-transform duration-200 ease-in-out font-space
        ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b-4 border-neo-yellow bg-black p-4 text-neo-yellow">
          <span className="font-bold tracking-tighter">BOT//AI</span>
          <button
            className="flex h-7 w-7 items-center justify-center border-2 border-neo-yellow text-neo-yellow hover:bg-neo-yellow hover:text-black"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* 1. Navigasi */}
        <ul className="flex flex-col gap-2 p-3">
          {NAV_ITEMS.map((item) => (
            <li key={item.label}>
              <NavLink
                id={item.label === 'About' ? `drawer-nav-about` : ''}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block neo-btn px-4 py-3 text-xs border-2.5 border-black transition-all shadow-neo-sm hover:bg-neo-red dark:border-neo-yellow dark:shadow-[2px_2px_0_0_#FFEE00]
                    ${isActive
                    ? "bg-black text-neo-yellow dark:bg-neo-yellow dark:text-black"
                    : "bg-white text-black dark:bg-zinc-900 dark:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>


        {/* 2. Elemen Kotak Pesan & Mode Kontrol dari Sidebar */}
        <div className="p-3 dark:border-neo-yellow bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b-2 border-black dark:border-neo-yellow pb-2 mb-3">
            <span>{`${msgCount} Pesan`}</span>
            <span className="bg-neo-yellow text-black px-1.5 py-0.5 rounded-none font-bold">
              v1.0.4
            </span>
          </div>
          <button
            onClick={() => {
              resetChat(chatPresenter);
              setMenuOpen(false); // Tutup drawer setelah reset
            }}
            className="neo-btn w-full py-2 mb-2 bg-neo-yellow text-[10px] text-black shadow-neo-sm"
          >
            Reset Chat
          </button>
        </div>

        {/* 3. Elemen Status Online/Offline */}
        <div className="flex flex-col gap-2 p-2 bg-neo-white-neutral">
          <div className="flex justify-between items-center bg-black text-white px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider">
            {isOnline ? (
              <>
                <div className="w-2 h-2 bg-neo-green border-2 border-black rounded-full animate-pulse" />
                Online
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-neo-red border-2 border-black rounded-full" />
                Offline
              </>
            )}
          </div>
        </div>

        {/* 4. Komponen Fitur Tambahan */}
        <div id="drawer-achievement">
          <Achievement
            isDesktop={false}
            setModalScore={(val) => {
              setModalScore(val);
              setMenuOpen(false); // Tutup drawer jika modal rating terbuka
            }}
            isOnline={isOnline}
          />
        </div>

        {/* Mobile button login */}
        {!user && (
          <div className="mt-auto border-t-2 border-muted p-4">
            <button
              onClick={() => {
                setMenuOpen(false);
                login();
              }}
              className="neo-btn flex w-full items-center justify-center gap-2 bg-neo-yellow py-3 text-xs shadow-neo-sm"
            >
              <GoogleIcon /> LOGIN GOOGLEs
            </button>
          </div>
        )}
      </aside >

      {/* Modal Popup */}
      <RatingModal isOpen={modalScore} onClose={() => setModalScore(false)} onSuccess={() => setModalScore(false)} />
    </>
  );
}