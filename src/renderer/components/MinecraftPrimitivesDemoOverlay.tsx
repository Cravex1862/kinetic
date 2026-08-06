import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import {
  InventorySlot,
  Hotbar,
  WholeInventory,
  SteveCharacter3D,
  MinecraftButton,
  MinecraftChat,
  ChatMessage,
} from '../primitives/minecraft';

export interface MinecraftPrimitivesDemoOverlayProps {
  onClose: () => void;
}

export const MinecraftPrimitivesDemoOverlay: React.FC<MinecraftPrimitivesDemoOverlayProps> = ({ onClose }) => {
  const [activeSlot, setActiveSlot] = useState(0);

  const mockHotbarSlots = [
    { id: '1', itemName: 'Diamond Sword', count: 1, itemIcon: 'diamond_sword' },
    { id: '2', itemName: 'Diamond Pickaxe', count: 1, itemIcon: 'diamond_pickaxe' },
    { id: '3', itemName: 'Golden Apple', count: 16, itemIcon: 'golden_apple' },
    { id: '4', itemName: 'Redstone Dust', count: 64, itemIcon: 'redstone' },
    { id: '5', itemName: 'Command Block Minecart', count: 64, itemIcon: 'command_block_minecart' },
    { id: '6', itemName: 'Ender Pearl', count: 16, itemIcon: 'ender_pearl' },
    { id: '7', itemName: 'Cooked Beef', count: 32, itemIcon: 'cooked_beef' },
    { id: '8', itemName: 'Enchanted Book', count: 1, itemIcon: 'enchanted_book' },
    { id: '9', itemName: 'Water Bucket', count: 1, itemIcon: 'water_bucket' },
  ];

  const mockInventorySlots = [
    { id: 'inv-1', itemName: 'Oak Door', count: 64, itemIcon: 'oak_door' },
    { id: 'inv-2', itemName: 'Iron Ingot', count: 42, itemIcon: 'iron_ingot' },
    { id: 'inv-3', itemName: 'Emerald', count: 12, itemIcon: 'emerald' },
    { id: 'inv-4', itemName: 'Netherite Scrap', count: 20, itemIcon: 'netherite_scrap' },
    { id: 'inv-5', itemName: 'Totem of Undying', count: 1, itemIcon: 'totem_of_undying' },
    { id: 'inv-6', itemName: 'Bow', count: 1, itemIcon: 'bow' },
    { id: 'inv-7', itemName: 'Arrow', count: 64, itemIcon: 'arrow' },
    { id: 'inv-8', itemName: 'Blaze Rod', count: 16, itemIcon: 'blaze_rod' },
    { id: 'inv-9', itemName: 'Ender Eye', count: 12, itemIcon: 'ender_eye' },
  ];

  const mockArmorSlots = [
    { id: 'a1', itemName: 'Diamond Helmet', itemIcon: 'diamond_helmet' },
    { id: 'a2', itemName: 'Diamond Chestplate', itemIcon: 'diamond_chestplate' },
    { id: 'a3', itemName: 'Diamond Leggings', itemIcon: 'diamond_leggings' },
    { id: 'a4', itemName: 'Diamond Boots', itemIcon: 'diamond_boots' },
  ];

  const mockShieldSlot = { id: 's1', itemName: 'Shield', itemIcon: 'shield' };

  const mockMessages: ChatMessage[] = [
    { id: 'm1', username: 'Steve', text: 'Welcome to the Minecraft Primitives Sandbox!', color: '#55ff55' },
    { id: 'm2', username: 'Alex', text: 'Press ESC or Ctrl+Shift+I to exit.', color: '#ffff55' },
    { id: 'm3', username: 'KineticAI', text: 'Voxel graphics pipeline ready.', color: '#ff55ff' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 overflow-y-auto font-mono">
      <div className="relative w-full max-w-5xl bg-[#1e1e1e] border-4 border-[#373737] p-6 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-6 text-white">

        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-400 drop-shadow-[2px_2px_0px_#000000]">
              Minecraft Primitives Sandbox
            </h2>
            <p className="text-xs text-gray-400">
              Shortcut: <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-300">Ctrl + Shift + I</kbd>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 hover:bg-red-600 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Grid Preview Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Left Column: WholeInventory & Hotbar */}
          <div className="flex flex-col gap-6 items-center">
            <h3 className="text-sm font-bold text-gray-300 self-start">1. WholeInventory GUI & Hotbar</h3>
            <WholeInventory
              inventorySlots={mockInventorySlots}
              hotbarSlots={mockHotbarSlots}
              armorSlots={mockArmorSlots}
              shieldSlot={mockShieldSlot}
              activeHotbarIndex={activeSlot}
              onSelectHotbarSlot={setActiveSlot}
              characterPreview={<SteveCharacter3D />}
            />
          </div>

          {/* Right Column: Individual Slots, Buttons, & Chat */}
          <div className="flex flex-col gap-6">

            {/* Standalone Slots Showcase */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2">2. Standalone InventorySlot States</h3>
              <div className="flex gap-3 bg-[#373737] p-3 rounded-lg border-2 border-gray-700">
                <InventorySlot itemName="Normal Slot" count={1} itemIcon="apple" />
                <InventorySlot itemName="Active Slot" count={64} itemIcon="redstone" isActive />
                <InventorySlot itemName="Selected Slot" count={16} itemIcon="emerald" isSelected />
                <InventorySlot itemName="Damaged Item" count={1} itemIcon="diamond_sword" durabiltyPercent={35} />
              </div>
            </div>

            {/* Standalone Hotbar HUD */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2">3. Standalone Hotbar HUD Component</h3>
              <div className="bg-[#373737] p-3 rounded-lg border-2 border-gray-700 overflow-x-auto">
                <Hotbar slots={mockHotbarSlots} activeSlotIndex={activeSlot} onSelectSlot={setActiveSlot} />
              </div>
            </div>

            {/* Minecraft Buttons */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2">3. MinecraftButton Component</h3>
              <div className="flex flex-wrap gap-3">
                <MinecraftButton label="Build Scene" onClick={() => alert('Build clicked!')} />
                <MinecraftButton label="Disabled" disabled />
              </div>
            </div>

            {/* Minecraft Chat */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2">4. MinecraftChat Component</h3>
              <MinecraftChat messages={mockMessages} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-800 pt-4">
          <MinecraftButton label="Close Preview" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};
