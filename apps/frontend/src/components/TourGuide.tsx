// src/components/onboarding/TourGuide.tsx
import { useEffect, useState, useCallback } from "react";
import type { CallBackProps, Step, TooltipRenderProps } from "react-joyride";
import Joyride, { EVENTS, STATUS } from "react-joyride";
import { X, ArrowRight, ArrowLeft, SkipForward, Play } from "lucide-react";
import { TUTORIAL_YT } from "@/constants";

interface TourGuideProps {
    start: boolean;
    setStartTour: (value: boolean) => void;
    onTourEnd: () => void;
    // Callback untuk buka/tutup mobile drawer dari luar
    onOpenDrawer?: () => void;
    onCloseDrawer?: () => void;
}

const STEP_META = [
    { label: "Selamat Datang", icon: "👋" },
    { label: "Navigasi", icon: "🗺️" },
    { label: "Area Chat", icon: "💬" },
    { label: "Progress Sidebar", icon: "🎁" },
];

const isMobile = () => window.innerWidth < 640;

// Target selector per step: [desktop, mobile]
const TOUR_TARGETS: [string | null, string | null][] = [
    [null, null],                         // step 0: center modal
    ["#nav-about", "#nav-about-mobile"],  // step 1: navbar About
    [".main-message", ".main-message"],   // step 2: chat area (sama)
    [".tour-sidebar", "#drawer-achievement"], // step 3: sidebar / drawer achievement
];
const DRAWER_SELECTOR = "#mobile-drawer";

const getTarget = (index: number) => {
    const entry = TOUR_TARGETS[index];
    if (!entry) return null;
    return isMobile() ? entry[1] : entry[0];
};

const waitForDrawerTransition = (timeout = 500): Promise<void> => {
    return new Promise((resolve) => {
        const drawer = document.querySelector<HTMLElement>(DRAWER_SELECTOR);
        if (!drawer) {
            resolve();
            return;
        }

        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            drawer.removeEventListener("transitionend", onEnd);
            resolve();
        };

        const onEnd = (e: TransitionEvent) => {
            if (e.propertyName === "transform") finish();
        };

        drawer.addEventListener("transitionend", onEnd);
        // fallback kalau transitionend tidak fire (misal drawer sudah di posisi sama)
        setTimeout(finish, timeout);
    });
};

const waitForElement = (selector: string, timeout = 1000): Promise<boolean> => {
    return new Promise((resolve) => {
        const start = performance.now();
        const check = () => {
            if (document.querySelector(selector)) {
                resolve(true);
                return;
            }
            if (performance.now() - start >= timeout) {
                resolve(false);
                return;
            }
            requestAnimationFrame(check);
        };
        check();
    });
};

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({
    index, isLastStep, step,
    backProps, closeProps, primaryProps, skipProps, tooltipProps,
}: TooltipRenderProps) => (
    <div {...tooltipProps} style={{ outline: "none" }} className="relative">
        <div className="absolute inset-0 bg-black" style={{ transform: "translate(5px, 5px)", zIndex: -1 }} />
        <div
            className="relative bg-neo-yellow border-2 border-black flex flex-col"
            style={{
                width: index === 0 ? 520 : 360, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(var(--vh, 1vh) * 100 - 32px)"
            }}
        >
            <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b-2 border-black bg-black text-neo-yellow">
                <div className="flex items-center gap-2">
                    <span>{STEP_META[index].icon}</span>
                    <span className="text-xxs font-black uppercase tracking-widest">{STEP_META[index].label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {STEP_META.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-none transition-all duration-300 border border-neo-yellow ${i === index ? "w-6 bg-neo-yellow" : i < index ? "w-3 bg-zinc-400" : "w-3 bg-zinc-700"
                            }`} />
                    ))}
                </div>
                <button {...closeProps} className="flex items-center justify-center w-6 h-6 hover:bg-neo-yellow hover:text-black transition-colors">
                    <X size={12} strokeWidth={3} />
                </button>
            </div>

            <div className="p-5 overflow-y-auto">{step.content}</div>

            <div className="flex shrink-0 items-center justify-between px-3 sm:px-5 pb-3 sm:pb-4">
                <span className="text-[8px] sm:text-xxs font-black text-black uppercase opacity-60 tracking-widest">
                    {index + 1} / {STEP_META.length}
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {index > 0 && (
                        <button {...backProps} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-black bg-white text-black text-xxs sm:text-xxs font-black uppercase tracking-wider shadow-neo-yellow hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            <ArrowLeft size={9} strokeWidth={3} />
                            <span className="hidden sm:inline">Kembali</span>
                        </button>
                    )}
                    {!isLastStep && (
                        <button {...skipProps} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-black bg-zinc-700 text-white text-xxs sm:text-xxs font-black uppercase tracking-wider shadow-neo-yellow hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            <SkipForward size={9} strokeWidth={3} />
                            <span className="hidden sm:inline">Skip</span>
                        </button>
                    )}
                    <button {...primaryProps} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 border-2 border-black bg-black text-neo-yellow text-xxs sm:text-xxs font-black uppercase tracking-wider shadow-[2px_2px_0_0_#facc15] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                        {isLastStep ? "Selesai 🎉" : <> Lanjut <ArrowRight size={9} strokeWidth={3} /> </>}
                    </button>
                </div>
            </div>
        </div>
    </div >
);

// ─── Step Contents ───────────────────────────────────────────────────────────
const WelcomeContent = () => (
    <div className="flex flex-col max-h-[70vh] overflow-y-auto gap-4">
        <div>
            <h2 className="text-xl font-black leading-tight">
                Selamat datang di <span className="bg-black text-neo-yellow px-1">Charema [vt1]</span>
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-800">
                Sistem rekomendasi mata kuliah berbasis kecerdasan buatan untuk membantu perencanaan akademis kamu.
                Tonton video berikut untuk mengenal cara penggunaan sistem ini.
            </p>
        </div>
        <div className="relative border-2 border-black overflow-hidden bg-black shadow-[4px_4px_0_0_#000] shrink-0">
            <div className="w-full aspect-video">
                <iframe
                    src={TUTORIAL_YT}
                    title="Perkenalan Sistem Akademik Bot"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-neo-yellow border border-black text-[8px] font-black uppercase flex items-center gap-1">
                <Play size={8} fill="black" /> Tutorial
            </div>
        </div>
        <p className="text-xxs text-zinc-600 italic border-l-2 border-black pl-2">
            Klik <strong>Lanjut</strong> untuk tur singkat fitur utama, atau <strong>Skip</strong> jika sudah siap.
        </p>
    </div>
);

const ABOUT_ITEMS = [
    { icon: "🎓", label: "List mata kuliah & rekomendasi" },
    { icon: "📊", label: "Statistik & progress pengguna" },
    { icon: "🏆", label: "Leaderboard score mahasiswa" },
    { icon: "▶️", label: "Video tutorial penggunaan" },
];

const NavbarContent = () => (
    <div className="flex flex-col gap-2 sm:gap-3">
        <p className="text-[12px] sm:text-[13px] leading-snug text-zinc-800 line-clamp-2 sm:line-clamp-none">
            Halaman <span className="font-black bg-black text-neo-yellow px-1">About</span> menampilkan
            statistik & rekomendasi akademik kamu.
        </p>
        <div className="border-2 border-black bg-white p-2 sm:p-3 shadow-neo-yellow">
            <div className="text-[8px] sm:text-xxs font-black uppercase tracking-widest opacity-50 mb-1.5">
                Isi halaman About
            </div>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 sm:flex sm:flex-col sm:gap-1">
                {ABOUT_ITEMS.map((item, i) => (
                    <li key={i} className="flex items-center gap-1 text-black overflow-hidden">
                        <span className="text-xxs shrink-0">{item.icon}</span>
                        <span className="text-xxs sm:text-[11px] font-bold truncate">{item.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const ChatContent = () => (
    <div className="flex flex-col gap-3">
        <p className="text-[13px] leading-relaxed text-zinc-800">Mulai interaksi dengan bot di area chat ini. Coba ketik pesan pertamamu!</p>
        <div className="border-2 border-black bg-white p-3 shadow-neo-yellow">
            <div className="text-xxs font-black uppercase tracking-widest opacity-50 mb-2">Contoh pertanyaan pertama</div>
            <div className="flex items-center gap-2 px-2 py-2 bg-zinc-100 border border-zinc-300">
                <span className="text-[12px] italic text-zinc-700">"siapa anda?"</span>
            </div>
        </div>
    </div>
);

const SidebarContent = () => (
    <div className="flex flex-col gap-3 [@media(max-height:700px)]:gap-2 [@media(max-height:550px)]:gap-1.5">
        <p className="text-[13px] leading-relaxed text-zinc-800 [@media(max-height:700px)]:text-[12px] [@media(max-height:550px)]:text-[11px] [@media(max-height:550px)]:leading-snug">
            Sidebar ini menampilkan progress interaksimu. Penuhi semua tahapan untuk mendapatkan reward
            <span className="hidden [@media(max-height:550px)]:inline"> <strong>Rp100k</strong></span>!
        </p>
        <div className="border-2 border-black bg-black text-neo-yellow p-4 [@media(max-height:700px)]:p-3 [@media(max-height:550px)]:hidden shadow-[2px_2px_0_0_#facc15]">
            <div className="text-3xl font-black [@media(max-height:700px)]:text-2xl">
                Rp100.000
            </div>
        </div>
        <p className="text-xxs text-zinc-900 border-l-2 border-black pl-2 [@media(max-height:550px)]:hidden">
            Progress tersimpan otomatis, kecuali Unlocked Tag.
        </p>
    </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const TourGuide = ({ start, setStartTour, onTourEnd, onOpenDrawer, onCloseDrawer }: TourGuideProps) => {
    const [{ run, stepIndex }, setState] = useState({ run: start, stepIndex: 0 });

    const resolveSteps = (): Step[] => [
        { content: <WelcomeContent />, placement: "center", target: "body", disableBeacon: true },
        { content: <NavbarContent />, placement: isMobile() ? "right" : "bottom", target: getTarget(1) ?? "body", disableBeacon: true, spotlightPadding: 12 },
        { content: <ChatContent />, placement: "top", target: getTarget(2) ?? "body", disableBeacon: true, spotlightPadding: 8 },
        {
            content: <SidebarContent />,
            placement: isMobile() ? "bottom" : "right",
            target: getTarget(3) ?? "body",
            disableBeacon: true,
            spotlightPadding: 8,
        },
    ];

    const [steps, setSteps] = useState<Step[]>(resolveSteps);

    const toggleDrawerExtraSpace = useCallback((enable: boolean) => {
        if (!isMobile()) return;

        const achievement = document.querySelector<HTMLElement>("#drawer-achievement");
        const drawer = document.querySelector<HTMLElement>("#mobile-drawer");
        if (!achievement || !drawer) return;

        achievement.style.transition = "margin-bottom 0.25s ease";
        achievement.style.marginBottom = enable ? "40rem" : "";

        if (enable) {
            requestAnimationFrame(() => {
                // scroll drawer sampai #drawer-achievement mentok di paling atas
                drawer.scrollTo({
                    top: achievement.offsetTop,
                    behavior: "smooth",
                });
            });
        }
    }, []);

    useEffect(() => {
        if (start) {
            setSteps(resolveSteps());
            setState({ run: true, stepIndex: 0 });
        }
    }, [start]);

    useEffect(() => {
        return () => toggleDrawerExtraSpace(false);
    }, [toggleDrawerExtraSpace]);

    const handleDrawerForStep = useCallback((nextIndex: number) => {
        if (!isMobile()) return;
        const needsDrawer = nextIndex === 1 || nextIndex === 3;
        const needsDrawerClosed = nextIndex === 2;

        if (needsDrawer) {
            onOpenDrawer?.();
        } else if (needsDrawerClosed) {
            onCloseDrawer?.();
        }

        toggleDrawerExtraSpace(nextIndex === 3);
    }, [onOpenDrawer, onCloseDrawer]);

    const handleCallback = useCallback((data: CallBackProps) => {
        const { status, type, index, action } = data;

        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            const next = action === "prev" ? index - 1 : index + 1;
            handleDrawerForStep(next);

            const targetSelector = getTarget(next);

            if (isMobile() && targetSelector && (next === 1 || next === 3)) {
                waitForDrawerTransition().then(() => waitForElement(targetSelector)).then(() => {
                    toggleDrawerExtraSpace(next === 3); // ← ditambahkan di sini
                    setState(prev => ({ ...prev, stepIndex: next }));
                });
            } else {
                setState(prev => ({ ...prev, stepIndex: next }));
            }
        }

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as typeof STATUS.FINISHED)) {
            onCloseDrawer?.();
            toggleDrawerExtraSpace(false);
            setState({ run: false, stepIndex: 0 });
            setStartTour(false);
            onTourEnd();
        }
    }, [handleDrawerForStep, onCloseDrawer, onTourEnd, setStartTour]);

    return (
        <Joyride
            continuous
            run={run}
            steps={steps}
            stepIndex={stepIndex}
            callback={handleCallback}
            tooltipComponent={CustomTooltip}
            scrollToFirstStep
            disableScrollParentFix
            spotlightPadding={10}
            styles={{
                options: {
                    zIndex: 9998,
                    overlayColor: "rgba(0, 0, 0, 0.85)",
                    arrowColor: "#facc15",
                },
                spotlight: { border: "2px solid #facc15" },
            }}
        />
    );
};

export default TourGuide;