import { useCallback, useEffect, useRef, } from 'react';
import axios from 'axios';
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import { BACKEND_URL } from '@/constants';
import { elysiaErr } from '@/lib/elysiaErr';
import { toast } from 'sonner';
import { useUIStore } from '@/stores/useUIStore';
import confetti from 'canvas-confetti';
import { TARGET_KRITIK, TARGET_TAGS } from 'shared';

export const useWinnerCheck = () => {
    // ambil nilai tags, feedback, score 
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const feedbackNumber = useAuthStore((state) => state.feedbackNumber);
    const tags = useChatStore((s) => s.tags);
    const rating = useAuthStore((state) => state.rating);
    const setLoadSaveTag = useChatStore((s) => s.setLoadSaveTag);
    const canSave = useChatStore((s) => s.canSave);
    const dismissSave = useChatStore((s) => s.dismissSave);

    const hasBeenWinner = useUIStore((s) => s.hasBeenWinner);
    const hasBeenCalonWinner = useUIStore((s) => s.hasBeenCalonWinner);
    const setHasBeenWinner = useUIStore((s) => s.setHasBeenWinner);
    const setHasBeenCalonWinner = useUIStore((s) => s.setHasBeenCalonWinner);
    const setShowWinnerModal = useUIStore((s) => s.setShowWinnerModal);
    const setShowCalonWinnerModal = useUIStore((s) => s.setShowCalonWinnerModal);

    // Ref untuk mencegah request dipanggil berulang kali saat re-render
    const hasClaimedRef = useRef(false);

    const saveUpdateTag = useCallback(async () => {
        setLoadSaveTag(true);
        try {
            if (user?.user_key !== 4404) {
                await axios.post(
                    `${BACKEND_URL}/achievement`,
                    { user_key: user?.user_key, tags },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                toast.success("Unlocked Tags is saved!");
            } else {
                toast.info("Akun Public, data tidak akan tersimpan ke database!");
            }
            dismissSave();
        } catch (error) {
            elysiaErr(error);
            console.error("Gagal mengambil data statistik:", error);
        } finally {
            setLoadSaveTag(false);
        }
    }, [user?.user_key, tags, token, setLoadSaveTag, dismissSave]);


    useEffect(() => {
        const isEligible = tags.length >= TARGET_TAGS && feedbackNumber >= TARGET_KRITIK && rating !== null;
        const isCalonEligible = tags.length >= 15 && feedbackNumber >= TARGET_KRITIK && rating !== null;
        // console.log("useWinner: isEligible", isEligible);
        // console.log("useWinner: canSave", canSave);
        // console.log(user?.user_key);
        // console.log(!hasClaimedRef.current);

        // 2nd Turn
        if (!hasBeenWinner && isEligible && user?.user_key && user.user_key !== 1495) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
            setHasBeenWinner(true);
            setShowWinnerModal(true);
        }
        if (!hasBeenCalonWinner && isCalonEligible && user?.user_key) {
            const claimCalonWinner = async () => {
                try {
                    // 1. Await simpan tag terlebih dahulu
                    if (canSave) {
                        await saveUpdateTag();
                    }

                    // 2. Kirim klaim winner
                    const response = await axios.post(
                        `${BACKEND_URL}/calon-winner/${user.user_key}`,
                        {},
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );
                    if (response.data.is_eligible) {
                        console.log('Berhasil klaim status calon pemenang:', response.data);
                        // confetty
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                        setHasBeenCalonWinner(true);
                        setShowCalonWinnerModal(true);
                    }
                } catch (error) {
                    hasClaimedRef.current = false; // Reset jika gagal agar bisa di-retry
                    elysiaErr(error);
                    console.error('Gagal klaim calon pemenang:', error);
                }
            };

            claimCalonWinner();
        }
    }, [tags.length, feedbackNumber, rating, user?.user_key, token, saveUpdateTag]);
};