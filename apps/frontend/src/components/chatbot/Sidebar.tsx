import Achievement from './Achievement'
import { RatingModal } from './RatingModal';
import { useUIStore } from '@/stores/useUIStore';
import { useChatPresenter } from '@/hooks/useChatPresenter';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import { STORAGE_VERSION } from '@/constants';

const Sidebar = ({
    isNavbarVisible,
    setNavbarVisible,
}: {
    isNavbarVisible: boolean;
    setNavbarVisible: (visible: boolean) => void;
}) => {
    const msgCount = useUIStore((s) => s.msgCount);
    const resetChat = useUIStore((s) => s.resetChat);
    const modalScore = useUIStore((s) => s.modalScore);
    const setModalScore = useUIStore((s) => s.setModalScore);

    const isOnline = useOnlineStatus();
    const chatPresenter = useChatPresenter(); // Panggil hook di top-level komponen

    return (
        <aside className="tour-sidebar hidden sm:flex sm:pt-6 flex-col gap-4 w-48 shrink-0">
            <div className={`neo-box p-3 dark:border-neo-yellow bg-white dark:bg-zinc-900`}>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest border-b-2 border-black dark:border-neo-yellow pb-2 mb-3">
                    <span>{`${msgCount} Pesan`}</span>
                    <span className="bg-neo-yellow text-black px-1.5 py-0.5 rounded-none font-bold">
                        {STORAGE_VERSION}
                    </span>
                </div>
                <button
                    onClick={() => resetChat(chatPresenter)}
                    className="neo-btn w-full py-2 mb-2 bg-neo-yellow text-[10px] text-black shadow-neo-sm"
                >
                    Reset Chat
                </button>
                <button
                    onClick={() => setNavbarVisible(!isNavbarVisible)}
                    className={`w-full flex justify-center items-center gap-2 px-2 py-1 transition-all border-2 border-black dark:border-neo-yellow shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-px active:translate-y-px
                                    ${isNavbarVisible
                            ? "bg-neo-white-cool dark:bg-zinc-800"
                            : "bg-neo-yellow dark:bg-neo-yellow text-black"}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="20" height="16" stroke="currentColor" strokeWidth="2.5" />
                        <path d="M2 10H22" stroke="currentColor" strokeWidth="2.5" />
                        {isNavbarVisible ? (
                            <g>
                                <path d="M7 15C7 15 9 12 12 12C15 12 17 15 17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                                <path d="M7 15C7 15 9 18 12 18C15 18 17 15 17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                                <rect x="11" y="14" width="2" height="2" fill="currentColor" />
                            </g>
                        ) : (
                            <g>
                                <path d="M8 13L16 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
                                <path d="M16 13L8 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
                            </g>
                        )}
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                        {isNavbarVisible ? "View_Mode" : "Focus_Mode"}
                    </span>
                </button>
            </div>

            {/* Versi */}
            <div className="flex flex-col gap-2 p-2 bg-neo-white-neutral border-2 border-black shadow-[3px_3px_0_0_#000]">
                {/* Label Versi Neo-Brutalist */}
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

            <Achievement isDesktop={true} setModalScore={setModalScore} isOnline={isOnline} />
            <RatingModal isOpen={modalScore} onClose={() => setModalScore(false)} onSuccess={() => setModalScore(false)} />
        </aside>
    )
}

export default Sidebar