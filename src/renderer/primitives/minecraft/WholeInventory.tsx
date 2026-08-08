import { BaseMotionProps } from '../types';
import React, { useState } from 'react';
import { InventorySlot } from "./InventorySlot";
import inventoryPng from './gui/container/inventory.png';
import recipeBookBtn from './gui/sprites/recipe_book/button.png';
import recipeBookBtnHighlight from './gui/sprites/recipe_book/button_highlighted.png';

export interface WholeInventoryProps extends BaseMotionProps {
    inventorySlots: Array<{ id: string; itemIcon?: string | React.ReactNode; itemName?: string; count?: number }>;
    hotbarSlots: Array<{ id: string; itemIcon?: string | React.ReactNode; itemName?: string; count?: number }>;
    armorSlots?: Array<{ id: string; itemIcon?: string | React.ReactNode; itemName?: string }>;
    shieldSlot?: { id: string; itemIcon?: string | React.ReactNode; itemName?: string };
    activeHotbarIndex: number;
    onSelectHotbarSlot?: (index: number) => void;
    characterPreview?: React.ReactNode;
    onToggleRecipeBook?: () => void;
}

export const WholeInventory: React.FC<WholeInventoryProps> = ({
    inventorySlots,
    hotbarSlots,
    armorSlots = [],
    shieldSlot,
    activeHotbarIndex,
    onSelectHotbarSlot,
    characterPreview,
    onToggleRecipeBook,
}) => {
    const [isRecipeHovered, setIsRecipeHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const fullInventory = Array.from({ length: 27 }, (_, i) => inventorySlots[i] || { id: `inv-${i}` });
    const fullHotbar = Array.from({ length: 9 }, (_, i) => hotbarSlots[i] || { id: `hotbar-${i}` });

    return (
        <div className="relative w-[352px] h-[332px] select-none shadow-[10px_10px_0px_rgba(0,0,0,0.5)] overflow-hidden bg-[#c6c6c6]">
            {/* 1:1 Authentic Pixelated Minecraft Inventory GUI Background PNG (256x256 atlas scaled 2x to 512x512, clipped to 352x332 GUI box) */}
            <img
                src={inventoryPng}
                alt="Minecraft Inventory GUI"
                className="w-[512px] h-[512px] max-w-none object-fill pixelated [image-rendering:pixelated] block pointer-events-none absolute top-0 left-0"
            />

            {/* 1. Armor Slots Overlay (4 Vertical Slots: Helmet, Chest, Legs, Boots) */}
            <div className="absolute top-[16px] left-[16px] flex flex-col gap-0">
                <InventorySlot transparent id="armor-head" itemIcon={armorSlots[0]?.itemIcon} itemName={armorSlots[0]?.itemName || 'Helmet'} />
                <InventorySlot transparent id="armor-chest" itemIcon={armorSlots[1]?.itemIcon} itemName={armorSlots[1]?.itemName || 'Chestplate'} />
                <InventorySlot transparent id="armor-legs" itemIcon={armorSlots[2]?.itemIcon} itemName={armorSlots[2]?.itemName || 'Leggings'} />
                <InventorySlot transparent id="armor-feet" itemIcon={armorSlots[3]?.itemIcon} itemName={armorSlots[3]?.itemName || 'Boots'} />
            </div>

            {/* 2. Character Viewport Overlay */}
            <div className="absolute top-[16px] left-[52px] w-[102px] h-[144px] flex items-center justify-center overflow-hidden">
                {characterPreview ? characterPreview : <span className="text-xs text-gray-400 font-bold">Avatar</span>}
            </div>

            {/* 3. Offhand Shield Slot Overlay */}
            <div className="absolute top-[124px] left-[154px]">
                <InventorySlot transparent id="shield-offhand" itemIcon={shieldSlot?.itemIcon} itemName={shieldSlot?.itemName || 'Offhand Shield'} />
            </div>

            {/* 4. Recipe Book Toggle Button (Authentic Green Book Icon next to Shield Slot) */}
            <div
                className="absolute top-[124px] left-[196px] w-[40px] h-[36px] cursor-pointer flex items-center justify-center z-10"
                onMouseEnter={() => { setIsRecipeHovered(true); setShowTooltip(true); }}
                onMouseLeave={() => { setIsRecipeHovered(false); setShowTooltip(false); }}
                onClick={() => onToggleRecipeBook && onToggleRecipeBook()}
            >
                <img
                    src={isRecipeHovered ? recipeBookBtnHighlight : recipeBookBtn}
                    alt="Recipe Book"
                    className="w-[40px] h-[36px] object-contain pixelated [image-rendering:pixelated]"
                />
                {showTooltip && (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#100010]/95 border-2 border-[#2b005c] rounded text-white text-[11px] font-mono whitespace-nowrap z-50 shadow-2xl pointer-events-none">
                        <span className="text-emerald-400 font-bold">Recipe Book</span>
                    </div>
                )}
            </div>

            {/* 5. Crafting 2x2 Grid Overlay */}
            <div className="absolute top-[32px] left-[176px] grid grid-cols-2 gap-0">
                <InventorySlot transparent id="craft-1" />
                <InventorySlot transparent id="craft-2" />
                <InventorySlot transparent id="craft-3" />
                <InventorySlot transparent id="craft-4" />
            </div>

            {/* 6. Crafting Result Output Slot Overlay */}
            <div className="absolute top-[56px] left-[288px]">
                <InventorySlot transparent id="craft-result" />
            </div>

            {/* 7. Main 27-Slot Storage Inventory Grid Overlay (3x9) */}
            <div className="absolute top-[168px] left-[16px] grid grid-cols-9 gap-0 w-[324px] h-[108px]">
                {fullInventory.map((slot, idx) => (
                    <InventorySlot
                        key={slot.id || idx}
                        transparent
                        id={slot.id || `inv-${idx}`}
                        itemIcon={slot.itemIcon}
                        itemName={slot.itemName}
                        count={slot.count}
                    />
                ))}
            </div>

            {/* 8. 9-Slot Hotbar Overlay (1x9) */}
            <div className="absolute top-[284px] left-[16px] grid grid-cols-9 gap-0 w-[324px] h-[36px]">
                {fullHotbar.map((slot, idx) => (
                    <InventorySlot
                        key={slot.id || idx}
                        transparent
                        id={slot.id || `hotbar-${idx}`}
                        itemIcon={slot.itemIcon}
                        itemName={slot.itemName}
                        count={slot.count}
                        isActive={activeHotbarIndex === idx}
                        onClick={() => onSelectHotbarSlot && onSelectHotbarSlot(idx)}
                    />
                ))}
            </div>
        </div>
    );
};