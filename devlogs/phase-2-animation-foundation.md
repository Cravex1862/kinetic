# Phase 2: Animation Foundation

**Status:** Complete  
**Duration:** Follow-up sprint

## Overview

Built the Morph Engine — a keyframe-based animation system that bridges the gap between static components and motion. Instead of hand-coding interpolate() calls for every animation, the AI writes *from* and *to* configs and the engine does the rest.

## What was built

### Morph Engine (`MorphSDK.tsx`)
- `morphValue(from, to, field, progress)` — single-value interpolator supporting 5 field types:
  - `number` — linear interpolation (lerp)
  - `color` — hex → RGB lerp → hex
  - `vec2` — independent XY lerp for position/size
  - `boolean` — snaps at 0.5 threshold
  - `string` — snaps at 0.5 threshold (for enum-like props)
- `applyMorphProps(from, to, schema, progress, easing)` — interpolates an entire config object
- `useMorph(from, to, schema, frame, duration, easing)` — React hook, returns fully resolved config at current frame
- `<Morph from to schema frame duration easing>` — render-prop wrapper component
- 5 easing presets via Remotion `Easing`:
  - `ease-in-out` — `Easing.inOut(Easing.ease)`
  - `ease-in` — `Easing.in(Easing.ease)`
  - `ease-out` — `Easing.out(Easing.ease)`
  - `linear` — identity function
  - `bounce` — `Easing.out(Easing.bounce)`

### Morph Registry (`MorphRegistry.ts`)
- Central schema definitions mapping every animatable prop to its interpolation type
- Covers all 22 Structural + Card components:
  - Numeric props: `width`, `height`, `padding`, `borderRadius`, `borderWidth`, `blur`, `splitRatio`, `sidebarWidth`, `columns`, `gap`, `activeTab`, etc.
  - Color props: `borderColor`, `accentColor`
  - String props: `url`, `variant`, `windowStyle`, `panelSize`, `position`, `status`, `label`, etc.
  - Boolean props: `visible`, `collapsed`, `highlighted`, `toggled`
- AI references this registry to know which props it can keyframe

### Morph Demo in DemoPage
- New "Morph Engine" section at the bottom of the showcase
- From/To keyframe panels with per-prop controls (panel size, URL, window style)
- Duration slider (15-150 frames)
- Easing selector dropdown (5 presets)
- Play button triggers morph animation between the two keyframe states
- Uses `AnimDeck` (existing play/stop wrapper) with `Morph` inside its render-prop

### Key Decisions
- **AI controls only 3 things**: `from` config, `to` config, `duration` (+ optional `easing`). No manual keyframes, no curve tweaking.
- **Schema-driven**: Each component declares which props are morphable and how. The engine is generic — add a new component, add its schema, and it's animatable.
- **Render-prop API**: `<Morph>` uses `children(resolved) => JSX` so it works with any component without coupling to specific prop interfaces.
- **Remotion-based**: Uses `interpolate()` and `Easing` from Remotion rather than CSS transitions, ensuring frame-accurate animation for video export.
- **`vec2` field type**: For position and size interpolation. Future phases will use this for layout cascade (when a parent moves, children move proportionally).

## Notable Fixes
- Fixed all `??` operator warnings (unary `+` + `??` → `||` since `NaN` isn't nullish)
- Removed `lg:col-span-2` from all oversized cards for consistent grid layout
- Aligned BrowserFrame and MockWindow control bar styles
- Wired up all missing Card SDK config controls (were decorative DOM IDs, now driven by React state)
- Added config controls for HeroMetricCard, ActionButton, TabSwitcherContainer, NotificationToaster, PushNotificationToast
