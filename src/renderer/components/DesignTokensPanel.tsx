import React from "react";
import {
  TextAa,
  Palette,
  TextB,
  TextItalic,
  TextUnderline,
  CaretDown,
} from "@phosphor-icons/react";
import type { FontSettings } from "./BrandStylingPanel";

interface DesignTokensPanelProps {
  fonts: Record<string, FontSettings>;
  setFonts: React.Dispatch<React.SetStateAction<any>>;
  swatches: Record<string, string>;
  setSwatches: React.Dispatch<React.SetStateAction<any>>;
  availableFonts: string[];
  scannedFonts?: string[];
}

export const DesignTokensPanel: React.FC<DesignTokensPanelProps> = ({
  fonts,
  setFonts,
  swatches,
  setSwatches,
  availableFonts,
  scannedFonts = [],
}) => {
  return (
    <>
      <div className="border-t border-[#27272a] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <TextAa size={14} className="text-gray-400" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Typography</h3>
        </div>
        <div className="space-y-4">
          {(["Title Font", "Heading", "Paragraph"] as const).map((label) => {
            const f = fonts[label];
            if (!f) return null;
            return (
              <div key={label} className="space-y-1.5">
                <span className="text-[10px] font-semibold text-gray-500 capitalize">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <select
                      value={f.fontFamily}
                      onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], fontFamily: e.target.value } }))}
                      className="w-full appearance-none bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-[11px] text-gray-300 focus:ring-1 focus:ring-violet-500 outline-none"
                    >
                      {availableFonts.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                    <CaretDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                  </div>
                  <div className="relative w-7 h-7 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                    <input type="color" value={f.color} onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], color: e.target.value } }))} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                    <div className="w-full h-full pointer-events-none" style={{ backgroundColor: f.color }} />
                  </div>
                  <select
                    value={f.size}
                    onChange={(e) => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], size: Number(e.target.value) } }))}
                    className="w-12 bg-[#18181b] border border-[#27272a] rounded-lg px-1 py-2 text-[10px] text-gray-400 font-medium outline-none"
                  >
                    {Array.from({ length: 63 }, (_, i) => i + 10).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {scannedFonts.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {scannedFonts.slice(0, 4).map((sf) => (
                      <button
                        key={sf}
                        type="button"
                        onClick={() => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], fontFamily: sf } }))}
                        className={`px-1.5 py-0.5 rounded text-[8px] border transition-colors ${f.fontFamily === sf ? "bg-violet-600 text-white border-violet-500" : "bg-gray-950/60 text-gray-500 border-gray-900 hover:text-gray-300"}`}
                      >
                        {sf}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  {(["bold", "italic", "underline"] as const).map((prop) => (
                    <button
                      key={prop}
                      onClick={() => setFonts((prev: any) => ({ ...prev, [label]: { ...prev[label], [prop]: !prev[label][prop] } }))}
                      className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-colors ${f[prop] ? "bg-[#18181b] border border-violet-500/30" : "bg-[#18181b] border border-[#27272a] hover:bg-[#27272a]"}`}
                    >
                      {prop === "bold" ? <TextB size={12} weight="bold" className="text-violet-400" /> : prop === "italic" ? <TextItalic size={12} className="text-violet-400" /> : <TextUnderline size={12} className="text-violet-400" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#27272a] p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Palette size={14} className="text-gray-400" />
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Brand Colors</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(swatches).map(([label, color]) => (
            <div key={label} className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] rounded-lg px-2 py-1.5 hover:border-gray-700 transition-colors">
              <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                <input type="color" value={color} onChange={(e) => setSwatches((prev: any) => ({ ...prev, [label]: e.target.value }))} className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
                <div className="w-full h-full pointer-events-none" style={{ backgroundColor: color }} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-semibold text-gray-400 capitalize truncate">{label}</span>
                <span className="text-[8px] text-gray-600 font-mono leading-none truncate">{color}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
