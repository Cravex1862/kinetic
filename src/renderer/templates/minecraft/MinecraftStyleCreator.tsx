import React, { useState } from "react";
import { X, MagnifyingGlass, Check, Sparkle, ArrowLeft } from '@phosphor-icons/react';
import logoIcon from '../../../../kinetic_brand/logo_transparent.svg';
import { CustomInstructionsPanel } from "../../components/CustomInstructionsPanel";
import { VoiceoverAudioField } from "../../components/VoiceoverAudioField";
import { AudioUploadField } from "../../components/AudioUploadField";
import { PreviewWindow } from "../../components/PreviewWindow";
import {
  ALL_MINECRAFT_ITEM_IDS,
  getItemTexture,
  MinecraftButton,
  SteveCharacter3D,
  WholeInventory,
  InventorySlot,
} from '../../primitives/minecraft';

import { runMinecraftPipeline } from "./minecraftPipeline";
import { PipelineState } from "@/renderer/agents/types";

const STATUS_LABELS: Record<string, string> = {
  'storyboarding': 'Storyboarding scenes...',
  'designing': 'Generating scene code...',
  'compiling': 'Verifying Remotion physics...',
  'done': 'Complete!',
  'error': 'Error',
};

export interface MinecraftStyleCreatorProps {
  onBack?: () => void;
  onClose?: () => void;
  onGenerate?: (data: {
    voiceoverMode: 'text' | 'audio';
    scriptText: string;
    voiceoverFile: File | null;
    soundtrackFile: File | null;
    selectedItems: string[];
    instructions: string;
    code?: string;
  }) => void;
}

export const MinecraftStyleCreator: React.FC<MinecraftStyleCreatorProps> = ({
  onBack,
  onClose,
  onGenerate,
}) => {
  const handleClose = onBack || onClose;

  const [voiceoverMode, setVoiceoverMode] = useState<'text' | 'audio'>('text');
  const [scriptText, setScriptText] = useState<string>('[00:01] Diamond sword reveal\n[00:04] Ender pearl teleport');
  const [voiceoverFile, setVoiceoverFile] = useState<File | null>(null);
  const [soundtrackFile, setSoundtrackFile] = useState<File | null>(null);
  const [beatCount, setBeatCount] = useState<number>(128);
  const [isAnalyzingBeat, setIsAnalyzingBeat] = useState<boolean>(false);

  const [instructions, setInstructions] = useState<string>('');
  const [isRefiningPrompt, setIsRefiningPrompt] = useState<boolean>(false);

  const [itemSearch, setItemSearch] = useState<string>('');
  const [itemFilterMode, setItemFilterMode] = useState<'all' | 'selected'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeHotbarIndex, setActiveHotbarIndex] = useState<number>(-1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);

  const rawFilteredItems = ALL_MINECRAFT_ITEM_IDS.filter(id => id.toLowerCase().includes(itemSearch.toLowerCase().trim()));
  const filteredItems = (itemFilterMode === 'selected' 
    ? selectedItems.filter(id => id.toLowerCase().includes(itemSearch.toLowerCase().trim())) 
    : rawFilteredItems
  ).slice(0, 42);

  const toggleItemSelect = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(i => i !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleRefinePrompt = () => {
    setIsRefiningPrompt(true);
    setTimeout(() => {
      setInstructions((prev) => prev + " [AI Enhanced: Cinematic 60fps motion, camera zoom, voxel particles]");
      setIsRefiningPrompt(false);
    }, 1000);
  };

  const handleSoundtrackSelect = (file: File | null) => {
    setSoundtrackFile(file);
    if (file) {
      setIsAnalyzingBeat(true);
      setTimeout(() => {
        setBeatCount(144);
        setIsAnalyzingBeat(false);
      }, 1500);
    }
  };

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    setPipelineState({ status: 'storyboarding', progress: 0.05 });

    const code = await runMinecraftPipeline({
      prompt: instructions || 'Minecraft item showcase with Steve 3D avatar & inventory walkthrough',
      selectedItems,
      activeHotbarIndex,
      voiceoverMode: voiceoverMode === 'text' ? 'script' : 'audio',
      scriptText,
      voiceoverFile,
      soundtrackFile,
      onState: setPipelineState,
    });

    if (onGenerate) {
      onGenerate({
        voiceoverMode,
        scriptText,
        voiceoverFile,
        soundtrackFile,
        selectedItems,
        instructions,
        code,
      });
    }

    setIsGenerating(false);
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col font-sans select-none overflow-hidden page-enter">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between border-b border-gray-900 px-6 py-3 bg-gray-950 shrink-0">
        <div className="flex items-center gap-3">
          {handleClose && (
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:border-purple-500 transition-all hover:scale-105"
              title="Go Back"
            >
              <ArrowLeft size={16} weight="bold" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" style={{
              filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.45)) brightness(1.15)'
            }} />
            <span className="text-sm font-bold tracking-wide text-white">kinetic</span>
          </div>
          <span className="text-xs text-gray-700">/</span>
          <span className="text-xs text-amber-400 font-semibold">Minecraft Studio</span>
        </div>
      </header>

      {/* Fullscreen Generator Main Area */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden bg-gray-950">

          <div className="col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1 custom-scrollbar">

            <VoiceoverAudioField
              mode={voiceoverMode}
              onModeChange={setVoiceoverMode}
              scriptText={scriptText}
              onScriptTextChange={setScriptText}
              audioFile={voiceoverFile}
              onAudioFileChange={setVoiceoverFile}
            />

            <div className="bg-gray-900/40 border border-gray-900 p-4 rounded-xl flex flex-col gap-3 flex-1 min-h-0">
              <div className="flex items-center justify-between border-b border-gray-900 pb-2">
                <h4 className="text-xs font-bold text-gray-400">
                  Item Selector {selectedItems.length > 0 && <span className="text-gray-500 font-normal">({selectedItems.length} selected)</span>}
                </h4>
                <button
                  type="button"
                  onClick={() => setItemFilterMode(itemFilterMode === 'all' ? 'selected' : 'all')}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {itemFilterMode === 'all' ? 'Show Selected' : 'Show All'}
                </button>
              </div>

              <div className="relative">
                <MagnifyingGlass size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search Minecraft Items..."
                  className="w-full bg-gray-950/60 border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition" 
                />
              </div>

              <div className="grid grid-cols-6 gap-1.5 flex-1 overflow-y-auto bg-gray-950/60 p-2.5 rounded-lg border border-gray-800 custom-scrollbar">
                {filteredItems.map(itemId => {
                  const isSelected = selectedItems.includes(itemId);
                  return (
                    <InventorySlot
                      key={itemId}
                      itemIcon={itemId}
                      itemName={itemId.replace(/_/g, ' ')}
                      transparent={!isSelected}
                      onClick={() => toggleItemSelect(itemId)}
                    />
                  );
                })}
              </div>
            </div>

          </div>

          <div className="col-span-8 flex flex-col gap-4 h-full overflow-hidden">

            <div className="flex-1 overflow-hidden">
              <PreviewWindow title="Minecraft Render Preview Canvas">
                <WholeInventory
                  inventorySlots={selectedItems.map((id, idx) => ({ id: `inv-${idx}`, itemIcon: id, itemName: id }))}
                  hotbarSlots={selectedItems.slice(0, 9).map((id, idx) => ({ id: `hb-${idx}`, itemIcon: id, itemName: id }))}
                  activeHotbarIndex={activeHotbarIndex}
                  onSelectHotbarSlot={setActiveHotbarIndex}
                  characterPreview={<SteveCharacter3D />}
                />
              </PreviewWindow>
            </div>

            <CustomInstructionsPanel
              instructions={instructions}
              setInstructions={setInstructions}
              isRefining={isRefiningPrompt}
              handleRefinePrompt={handleRefinePrompt}
              placeholder="Enter animation prompt..."
            />

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <AudioUploadField
                  audioFile={soundtrackFile}
                  beatCount={beatCount}
                  isAnalyzing={isAnalyzingBeat}
                  onSelectAudio={handleSoundtrackSelect}
                />
              </div>

              <div className="flex items-center gap-3 w-72 justify-end self-end pb-0.5">
                {pipelineState && pipelineState.status !== 'idle' && (
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex justify-between text-[10px] text-amber-400">
                      <span className="truncate">{STATUS_LABELS[pipelineState.status] || pipelineState.status}</span>
                      <span>{Math.round((pipelineState.progress || 0) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 ease-out"
                        style={{ width: `${(pipelineState.progress || 0) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                <MinecraftButton
                  label={isGenerating ? 'Generating...' : 'Generate'}
                  disabled={isGenerating}
                  onClick={handleGenerateClick}
                  className="!py-3 text-center min-w-[120px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MinecraftStyleCreator;