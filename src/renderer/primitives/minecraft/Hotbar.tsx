import { InventorySlot } from "./InventorySlot";

export interface HotbarProps {
    slots: Array<{ id: string; itemIcon?: string | React.ReactNode; itemName?: string; count?: number }>
    activeSlotIndex: number;
    onSelectSlot?: (index: number) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
    slots,
    activeSlotIndex,
    onSelectSlot
}) => {
    const filledSlots = Array.from({ length: 9 }, (_, i) => slots[i] || { id: `empty-${i}` });

    return (
        <div className="inline-flex items-center bg-[#8b8b8b] p-1 border-2 border-t-[#373737] border-l-[#373737] border-b-[#ffffff] border-r-[#ffffff]">
            {filledSlots.map((slot, idx) => (
                <div key={slot.id || idx} className={`relative ${idx > 0 ? '-ml-[2px]' : ''}`}>
                    <InventorySlot
                        itemIcon={slot.itemIcon}
                        itemName={slot.itemName}
                        count={slot.count}
                        isActive={activeSlotIndex === idx}
                        onClick={() => onSelectSlot && onSelectSlot(idx)}
                    />

                    {activeSlotIndex === idx && (
                        <div className="absolute -inset-1 border-4 border-white pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10" />
                    )}
                </div>
            ))}
        </div>
    );
};