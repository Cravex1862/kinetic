Status: completed
Title: Replace translucent purple selectors in Settings
Description: Settings shows resolution (4K/1080p/720p/480p), Video Layout (16:9/9:16), and Default Target FPS (30/60) as translucent purple pill selectors with `bg-violet-600/20 border` style (Image 5). User says they look "ass and vibe coded" — generic AI gradient, low contrast, not intentional. Need a distinctive selector per frontend-design skill.
Files: src/renderer/pages/Settings.tsx, src/renderer/components/BackgroundSelectorPanel.tsx, tailwind.config.js
Fix: Use frontend-design skill: brainstorm palette/type/layout/signature before building. Replace translucent pills with an intentional control — e.g. segmented control with hairline border + solid selected state, or custom radio with clear typography hierarchy and motion via `spring()`. Use design tokens (primaryColor/surfaceColor/textColor) via inline styles, not hardcoded violet translucency. Apply everywhere settings uses selectors.
