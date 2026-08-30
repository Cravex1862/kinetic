Status: completed
Title: Replace translucent PRESET MODELS selector
Description: Image 8 shows `PRESET MODELS` pill/dropdown with same translucent purple vibe-coded style as Settings selectors (Image 5). Likely in Settings model picker or header. User again flags translucent look as "ass" — needs a different, intentional selector.
Files: src/renderer/pages/Settings.tsx, src/renderer/pages/SetupWizard.tsx, src/renderer/hooks/useKineticSettings.ts
Fix: Same as 18 — replace translucent pill with intentional control per frontend-design. Create compact token system: palette 4–6 hex, type 2 roles, layout concept, signature (single memorable element). For model picker, consider combobox with search + provider icons, or segmented cards with model caps, not translucent pill. Apply design tokens via inline style, use `spring()` for open/close.
