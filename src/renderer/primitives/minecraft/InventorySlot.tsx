import React, { useState } from 'react';
import { getItemTexture } from './itemRegistry';

export interface InventorySlotProps {
    id?: string;
    itemIcon?: string | React.ReactNode;
    itemName?: string;
    count?: number;
    isActive?: boolean;
    isSelected?: boolean;
    durabiltyPercent?: number;
    transparent?: boolean;
    onClick?: () => void;
    className?: string;
}

export const InventorySlot: React.FC<InventorySlotProps> = ({
    itemIcon,
    itemName,
    count,
    isActive = false,
    isSelected = false,
    durabiltyPercent,
    transparent = false,
    onClick,
    className = '',
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    let resolvedTexture = '';
    if (typeof itemIcon === 'string') {
        if (itemIcon.includes('/') || itemIcon.includes('.') || itemIcon.startsWith('data:')) {
            resolvedTexture = itemIcon;
        } else {
            resolvedTexture = getItemTexture(itemIcon);
        }
    }

    const baseStyles = transparent
        ? 'relative w-[36px] h-[36px] flex items-center justify-center cursor-pointer select-none'
        : 'relative w-9 h-9 bg-[#8b8b8b] border-2 border-t-[#373737] border-l-[#373737] border-b-[#fff] border-r-[#fff] flex items-center justify-center cursor-pointer select-none transition-all';

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`${baseStyles} ${isActive ? 'ring-2 ring-[#ffffff]/80 z-20' : ''} ${isSelected ? 'bg-amber-950/80 border-amber-500' : ''} ${className}`}
        >
            <div className='w-full h-full p-0.5 flex items-center justify-center relative'>
                {itemIcon ? (
                    typeof itemIcon === 'string' ? (
                        resolvedTexture ? (
                            <img src={resolvedTexture} alt={itemName || 'Item'} className='w-7 h-7 object-contain pixelated [image-rendering:pixelated]' />
                        ) : (
                            <span className="text-base select-none leading-none flex items-center justify-center">{itemIcon}</span>
                        )
                    ) : (
                        <div className='w-7 h-7 flex items-center justify-center text-amber-300'>
                            {itemIcon}
                        </div>
                    )
                ) : null}

                {count && count > 1 && (
                    <span className='absolute bottom-0.5 right-1 text-[11px] font-bold text-white font-mono drop-shadow-[2px_2px_0px_#000]'>
                        {count}
                    </span>
                )}

                {durabiltyPercent !== undefined && (
                    <div className='absolute bottom-1 left-1 right-1 h-1 bg-gray-950 rounded-none overflow-hidden'>
                        <div
                            style={{
                                width: `${durabiltyPercent}%`,
                                backgroundColor: durabiltyPercent > 50 ? '#55ff55' : durabiltyPercent > 20 ? '#ffaa00' : '#ff5555',
                            }}
                            className='h-full'
                        />
                    </div>
                )}
            </div>

            {showTooltip && itemName && (
                <div className='absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#100010]/95 border-2 border-[#2b005c] rounded text-white text-[11px] font-mono whitespace-nowrap z-50 shadow-2xl pointer-events-none'>
                    <span className='text-purple-300 font-bold'>{itemName}</span>
                </div>
            )}
        </div>
    )
}

