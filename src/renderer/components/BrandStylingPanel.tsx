import React, { useState, useEffect } from 'react';
import { Palette, TextB, TextItalic, TextUnderline, Image as ImageIcon } from '@phosphor-icons/react';
import { BackgroundSelectorPanel, BackgroundSelection } from './BackgroundSelectorPanel';

export interface FontSettings {
    fontFamily: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    color: string;
    size: number;
}

interface StylingProps {
    fonts: Record<string, FontSettings>;
    setFonts: React.Dispatch<React.SetStateAction<any>>;
    swatches: Record<string, string>;
    setSwatches: React.Dispatch<React.SetStateAction<any>>;
    availableFonts: string[];
    scannedFonts?: string[];
    bgSelection?: BackgroundSelection;
    onSelectBackground?: (bg: BackgroundSelection) => void;
}

const SIZE_OPTIONS = Array.from({ length: 63 }, (_, i) => i + 10);

export const BrandStylingPanel: React.FC<StylingProps> = ({
    fonts,
    setFonts,
    swatches,
    setSwatches,
    availableFonts,
    scannedFonts = [],
    bgSelection,
    onSelectBackground,
}) => {
    const [activeTab, setActiveTab] = useState<'styling' | 'backgrounds'>('styling');

    const toggleFontProp = (row: string, prop: 'bold' | 'italic' | 'underline') => {
        setFonts((prev: any) => ({
            ...prev,
            [row]: { ...prev[row], [prop]: !prev[row][prop] },
        }));
    };
    
    const updateFont = (row: string, field: string, value: any) => {
        setFonts((prev: any) => ({
            ...prev,
            [row]: { ...prev[row], [field]: value }
        }));
    };

    useEffect(() => {
        const activeFamilies = Object.values(fonts).map(f => f?.fontFamily).filter(Boolean);
        activeFamilies.forEach(family => {
            if (!availableFonts.includes(family)) {
                const formattedName = family.replace(/\s+/g, '+');
                const linkId = `gfont-${formattedName.toLowerCase()}`;
                if (!document.getElementById(linkId)) {
                    const fontLink = document.createElement('link');
                    fontLink.id = linkId;
                    fontLink.rel = 'stylesheet';
                    fontLink.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;
                    document.head.appendChild(fontLink);
                }
            }
        });
    }, [fonts, availableFonts]);

    const renderRow = (label: string) => {
        const f = fonts[label];
        if (!f) return null;
        return (
            <div key={label} className="space-y-1.5">
                <span className="text-[10px] font-semibold text-gray-500 capitalize">{label}</span>
                <div className="flex gap-1.5">
                    <select
                        value={f.fontFamily}
                        onChange={(e) => updateFont(label, 'fontFamily', e.target.value)}
                        className="flex-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-xs text-white outline-none"
                    >
                        {availableFonts.map((font) => <option key={font} value={font} className="bg-gray-950 text-white">{font}</option>)}
                    </select>
                </div>
                {scannedFonts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {scannedFonts.slice(0, 4).map((font) => (
                            <button
                                key={font}
                                type="button"
                                onClick={() => updateFont(label, 'fontFamily', font)}
                                className={`px-1.5 py-0.5 rounded text-[8px] border transition-colors ${f.fontFamily === font ? 'bg-violet-600 text-white border-violet-500' : 'bg-gray-950/60 text-gray-500 border-gray-900 hover:text-gray-300'}`}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded border border-gray-800">
                        <button
                            type="button"
                            onClick={() => toggleFontProp(label, 'bold')}
                            className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.bold ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
                        >
                            <TextB size={12} weight="bold" />
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleFontProp(label, 'italic')}
                            className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.italic ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
                        >
                            <TextItalic size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleFontProp(label, 'underline')}
                            className={`flex h-6 w-6 items-center justify-center text-[10px] transition-colors ${f.underline ? 'bg-violet-600 text-white' : 'bg-gray-950 text-gray-400 hover:text-gray-200'}`}
                        >
                            <TextUnderline size={12} />
                        </button>
                    </div>
                    <input
                        type="color"
                        value={f.color}
                        onChange={(e) => updateFont(label, 'color', e.target.value)}
                        className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                        title={f.color}
                    />
                    <select
                        value={f.size}
                        onChange={(e) => updateFont(label, 'size', Number(e.target.value))}
                        className="w-12 rounded border border-gray-800 bg-gray-900 px-1 py-0.5 text-xs text-white outline-none"
                    >
                        {SIZE_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-gray-950 text-white">
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    return (
        <section className="bg-gray-900/20 border border-gray-900 rounded-xl p-4 space-y-4">
            {/* TOP TAB SWITCHER */}
            <div className="flex border-b border-gray-800 pb-2 gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTab('styling')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                        activeTab === 'styling'
                            ? 'border-purple-500 text-purple-400'
                            : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                >
                    <Palette size={14} />
                    Styling & Brand
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('backgrounds')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                        activeTab === 'backgrounds'
                            ? 'border-purple-500 text-purple-400'
                            : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                >
                    <ImageIcon size={14} />
                    Backgrounds
                </button>
            </div>

            {activeTab === 'styling' ? (
                <>
                    <div className="space-y-3">
                        {renderRow('Title Font')}
                        {renderRow('Heading')}
                        {renderRow('Paragraph')}
                    </div>

                    <div className="pt-1 border-t border-gray-900">
                        <span className="text-[10px] font-semibold text-gray-500 block mb-2">Palette Colors</span>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(swatches).map(([label, color]) => (
                                <div key={label} className="flex items-center gap-2 bg-gray-950/40 border border-gray-900/50 rounded-lg px-2 py-1.5 hover:border-gray-800 transition-colors">
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => setSwatches((prev: any) => ({ ...prev, [label]: e.target.value }))}
                                            className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[8px] font-semibold truncate capitalize">{label}</span>
                                        <span className="text-[8px] text-gray-400 font-mono leading-none truncate">{color}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <div className="pt-1">
                    <BackgroundSelectorPanel
                        currentSelection={bgSelection}
                        onSelectBackground={(bg) => onSelectBackground && onSelectBackground(bg)}
                    />
                </div>
            )}
        </section>
    );
};