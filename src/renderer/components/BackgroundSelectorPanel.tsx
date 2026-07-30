import React, { useState, useMemo } from 'react';
import { CaretDown, CaretUp, Sliders, Palette, Image as ImageIcon } from '@phosphor-icons/react';

export interface BackgroundSelection {
    type: 'color' | 'gradient' | 'image';
    color?: string;
    gradient?: string;
    imageUrl?: string;
    blurPx?: number;
}

interface BackgroundSelectorPanelProps {
    currentSelection?: BackgroundSelection;
    onSelectBackground: (bg: BackgroundSelection) => void;
}

const rawBackgrounds = ((import.meta as any).glob(
    '/src/renderer/primitives/backgrounds/*/*.{png,jpg,jpeg,webp,svg}',
    { eager: true, import: 'default' }
) || {}) as Record<string, string>;

const toDataUrl = (url: string): Promise<string> => {
    if (!url || url.startsWith('data:')) return Promise.resolve(url);
    return fetch(url)
        .then((res) => res.blob())
        .then((blob) => new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(url);
            reader.readAsDataURL(blob);
        }))
        .catch(() => url);
};

export const BackgroundSelectorPanel: React.FC<BackgroundSelectorPanelProps> = ({
    currentSelection,
    onSelectBackground,
}) => {
    const [useGradient, setUseGradient] = useState<boolean>(currentSelection?.type === 'gradient');
    const [blurPx, setBlurPx] = useState<number>(currentSelection?.blurPx ?? 0);
    const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
    const [color1, setColor1] = useState('#0f172a');
    const [color2, setColor2] = useState('#311042');
    const [angle, setAngle] = useState(135);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const categories = useMemo(() => {
        const map: Record<string, { name: string; url: string }[]> = {};

        Object.entries(rawBackgrounds).forEach(([filePath, url]) => {
            const parts = filePath.split('/');
            const fileName = parts[parts.length - 1];
            const categoryName = parts[parts.length - 2] || 'General';

            if (!map[categoryName]) {
                map[categoryName] = [];
            }
            map[categoryName].push({
                name: fileName.replace(/\.[^/.]+$/, ''),
                url,
            });
        });

        return map;
    }, []);

    const handleBlurChange = (val: number) => {
        setBlurPx(val);
        if (currentSelection) {
            onSelectBackground({ ...currentSelection, blurPx: val });
        } else {
            onSelectBackground({ type: 'color', color: '#09090b', blurPx: val });
        }
    };

    const handleGradientApply = (c1 = color1, c2 = color2, gAngle = angle, gType = gradientType) => {
        const gradientStr =
            gType === 'radial'
                ? `radial-gradient(circle at center, ${c1}, ${c2})`
                : `linear-gradient(${gAngle}deg, ${c1}, ${c2})`;

        onSelectBackground({
            type: 'gradient',
            gradient: gradientStr,
            blurPx,
        });
    };

    const handleImageSelect = async (url: string) => {
        const dataUrl = await toDataUrl(url);
        onSelectBackground({
            type: 'image',
            imageUrl: dataUrl,
            blurPx,
        });
    };

    const toggleExpand = (cat: string) => {
        setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
    };

    return (
        <div className="space-y-5 p-1 text-white font-sans text-xs">
            {/* 1. TOP BLUR SLIDER */}
            <div className="space-y-2 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                        <Sliders size={14} className="text-purple-400" />
                        Background Blur
                    </label>
                    <span className="text-[10px] font-mono text-purple-400 font-bold">{blurPx}px</span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={40}
                    value={blurPx}
                    onChange={(e) => handleBlurChange(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-800 accent-purple-600 outline-none"
                />
            </div>

            {/* 2. MODE TOGGLE CHECKBOX */}
            <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                    {useGradient ? <Palette size={14} className="text-purple-400" /> : <ImageIcon size={14} className="text-purple-400" />}
                    Enable Custom Gradient
                </span>
                <input
                    type="checkbox"
                    checked={useGradient}
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        setUseGradient(isChecked);
                        if (isChecked) {
                            handleGradientApply();
                        }
                    }}
                    className="h-4 w-4 cursor-pointer accent-purple-600 rounded"
                />
            </div>

            {/* 3. GRADIENT CONFIG (WHEN CHECKED) */}
            {useGradient ? (
                <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/60 p-3">
                    <h4 className="text-[11px] font-bold text-gray-400">Gradient Controls</h4>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded bg-gray-900 p-1.5 border border-gray-800 flex-1">
                            <input
                                type="color"
                                value={color1}
                                onChange={(e) => {
                                    setColor1(e.target.value);
                                    handleGradientApply(e.target.value, color2);
                                }}
                                className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                            />
                            <span className="text-[10px] font-mono text-gray-400">{color1}</span>
                        </div>

                        <div className="flex items-center gap-1.5 rounded bg-gray-900 p-1.5 border border-gray-800 flex-1">
                            <input
                                type="color"
                                value={color2}
                                onChange={(e) => {
                                    setColor2(e.target.value);
                                    handleGradientApply(color1, e.target.value);
                                }}
                                className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                            />
                            <span className="text-[10px] font-mono text-gray-400">{color2}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Angle:</span>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            value={angle}
                            onChange={(e) => {
                                const a = Number(e.target.value);
                                setAngle(a);
                                handleGradientApply(color1, color2, a);
                            }}
                            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-800 accent-purple-600 outline-none"
                        />
                        <span className="text-[10px] font-mono text-purple-400 w-8 text-right">{angle}°</span>
                    </div>
                </div>
            ) : (
                /* 4. WALLPAPERS & IMAGE TILES (WHEN UNCHECKED) */
                <div className="space-y-4">
                    {/* NO BACKGROUND (TRANSPARENT) BUTTON */}
                    <button
                        type="button"
                        onClick={() => onSelectBackground({ type: 'color', color: 'transparent', blurPx: 0 })}
                        className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 text-xs font-semibold transition-all ${
                            currentSelection?.color === 'transparent'
                                ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-md shadow-purple-500/20'
                                : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:text-white hover:border-gray-700'
                        }`}
                    >
                        <div className="w-4 h-4 rounded border border-gray-700 bg-[linear-gradient(45deg,#333_25%,transparent_25%),linear-gradient(-45deg,#333_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#333_75%),linear-gradient(-45deg,transparent_75%,#333_75%)] bg-[length:8px_8px]" />
                        <span>No Background (Transparent)</span>
                    </button>

                    {Object.keys(categories).length === 0 ? (
                        <div className="text-[11px] text-gray-500 italic p-3 text-center rounded border border-gray-800 bg-gray-950/40">
                            Add folders of images under <code className="text-purple-400">primitives/backgrounds/</code> to see category tiles.
                        </div>
                    ) : (
                        Object.entries(categories).map(([catName, images]) => {
                            const isExpanded = !!expandedCategories[catName];
                            const visibleImages = isExpanded ? images : images.slice(0, 3);

                            return (
                                <div key={catName} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-300 capitalize">{catName}</span>
                                        {images.length > 3 && (
                                            <button
                                                onClick={() => toggleExpand(catName)}
                                                className="flex items-center justify-center h-6 w-6 rounded bg-gray-900 text-gray-400 hover:text-white transition-colors"
                                            >
                                                {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        {visibleImages.map((img) => {
                                            const isSelected = currentSelection?.imageUrl === img.url;

                                            return (
                                                <button
                                                    key={img.url}
                                                    onClick={() => handleImageSelect(img.url)}
                                                    className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg border-2 transition-all ${
                                                        isSelected
                                                            ? 'border-purple-500 shadow-md shadow-purple-500/30 scale-105'
                                                            : 'border-gray-800 hover:border-gray-600'
                                                    }`}
                                                >
                                                    <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};