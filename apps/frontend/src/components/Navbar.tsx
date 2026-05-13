import { useState, useEffect, useRef } from "react";
import GoogleIcon from "./GoogleIcon";
import { useUI } from "../context/UIContext";

const NAV_ITEMS = [
  { label: "Chatbot", href: "/chatbot" },
  { label: "About", href: "/about" },
  { label: "Manage", href: "/manage" },
];

interface NavbarProps {
  activeMenu?: string;
  user?: { name: string; email: string; picture: string } | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function Navbar({
  activeMenu = "Chatbot",
  user = null,
  onLogin,
  onLogout
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);  
  const [isDark, setIsDark] = useState(false);
  const { isNavbarVisible } = useUI();
  const avatarContainerRef = useRef<HTMLDivElement>(null);

  const navbarRef = useRef<HTMLElement>(null);

  // Sinkronisasi tema dengan class .dark di <html>
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Tambahkan useEffect untuk handle klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Jika ref ada dan yang diklik BUKAN bagian dari kontainer ini
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
              <li key={item.label}>
                <a
                  href={item.href}
                  className={`block px-3 py-1 text-[11px] font-bold uppercase border-2.5 border-black transition-all shadow-neo-sm hover:bg-neo-red dark:border-neo-yellow dark:shadow-[2px_2px_0_0_#FFEE00]
                  ${activeMenu === item.label ? "bg-black text-neo-yellow dark:bg-neo-yellow dark:text-black" : "bg-white text-black dark:bg-zinc-900 dark:text-white"}`}
                >
                  {item.label}
                </a>
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
                  {user.picture ? (
                    <div className="relative h-7 w-7">
                      {/* Placeholder atau Spinner saat loading */}
                      {!isImageLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-zinc-300 dark:bg-zinc-700" />
                      )}

                      <img
                        src={user.picture}
                        alt={user.name}
                        onLoad={() => setIsImageLoaded(true)}
                        className={`h-7 w-7 border-2 border-black object-cover transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"
                          }`}
                      />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center border-2 border-black bg-neo-red text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
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
                        onLogout?.();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="neo-btn flex items-center gap-2 bg-white px-2 py-1.5 text-[10px] shadow-neo-sm hover:bg-neo-red dark:bg-zinc-900 dark:border-neo-yellow dark:text-white sm:px-3"
                onClick={onLogin}
              >
                <GoogleIcon />
                <span className="hidden sm:inline uppercase tracking-tight">Login Google</span>
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
        className={`fixed top-0 left-0 z-400 h-dvh w-[75vw] max-w-70 border-r-4 border-black bg-white shadow-[8px_0_0_0_#000] transition-transform duration-200 ease-in-out font-space
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

        <nav className="flex flex-col gap-2 p-3">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`neo-btn px-4 py-3 text-xs shadow-neo-sm ${activeMenu === item.label ? "bg-black text-neo-yellow" : "bg-white text-black"
                }`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Mobile button */}
        {!user && (
          <div className="mt-auto border-t-2 border-muted p-4">
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogin?.();
              }}
              className="neo-btn flex w-full items-center justify-center gap-2 bg-neo-yellow py-3 text-xs shadow-neo-sm"
            >
              <GoogleIcon /> LOGIN GOOGLEs
            </button>
          </div>
        )}
      </aside>
    </>
  );
}