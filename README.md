# kinetic

![version](https://img.shields.io/badge/version-1.0.0-green)

A React component library for building SaaS video demos and interactive showcases. Built on Electron, React, and Remotion.

## Primitives

Everything is composed from 5 SDKs:

- **Structural** — BrowserFrame, SidebarLayout, TopNavbar, cards, and other UI chrome
- **Transition** — SpringEnter, FadeBlur, SlideInOut, AccordionExpand, and other entry/exit animations
- **Motion** — Cursor trails, smooth scroll, text typewriter, drag-and-drop, marquee, progress rings
- **Charts** — Bar, line, pie, area, donut, scatter, sparkline, and funnel charts (all SVG-based)
- **Card** — CustomCard, GlassmorphicCard, ProfileHeader, PricingPlan, Kanban, Invoice, SettingsToggle, PushNotification

## Quick Start

```bash
npm install
npm run dev          # Launch Electron desktop studio
npx remotion preview src/renderer/Root.tsx   # Remotion canvas preview
npm run build        # Production build
```

## License

MIT
