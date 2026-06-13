// components/chatbot/RekomendasiMsg.tsx
import { useRecomToMatkul } from "@/hooks/useRecomToMatkul";
import { RekomResult } from "../RekomResult";

interface RekomendasiResultProps {
    selectedMatkulIds: number[];
}

const RekomendasiMsg = ({ selectedMatkulIds }: RekomendasiResultProps) => {
    const recoms = useRecomToMatkul();

    if (!recoms) return null;

    return (
        <div className="mt-4">
            <RekomResult
                recoms={recoms}
                mode="selected"
                selectedMatkulIds={selectedMatkulIds}
            />
        </div>
    );
};

export default RekomendasiMsg;