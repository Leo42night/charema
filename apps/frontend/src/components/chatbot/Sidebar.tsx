import Achievement from './Achievement'
import { RatingModal } from './RatingModal';
import { useUIStore } from '@/stores/useUIStore';
import { useChatPresenter } from '@/hooks/useChatPresenter';
import useOnlineStatus from '@/hooks/useOnlineStatus';
import SidebarBtn from '../SidebarBtn';

const Sidebar = ({
    isNavbarVisible,
    setNavbarVisible,
}: {
    isNavbarVisible: boolean;
    setNavbarVisible: (visible: boolean) => void;
}) => {
    const modalScore = useUIStore((s) => s.modalScore);
    const setModalScore = useUIStore((s) => s.setModalScore);

    const isOnline = useOnlineStatus();
    const chatPresenter = useChatPresenter(); // Panggil hook di top-level komponen

    return (
        <aside className="tour-sidebar hidden sm:flex sm:pt-6 flex-col gap-4 w-48 shrink-0">
            <SidebarBtn isNavbarVisible={isNavbarVisible}
                setNavbarVisible={setNavbarVisible}
                chatPresenter={chatPresenter}
                isOnline={isOnline}
                setModalScore={setModalScore}
                className="neo-box" />

            <Achievement isDesktop={true} isOnline={isOnline} />
            <RatingModal isOpen={modalScore} onClose={() => setModalScore(false)} onSuccess={() => setModalScore(false)} />
        </aside>
    )
}

export default Sidebar