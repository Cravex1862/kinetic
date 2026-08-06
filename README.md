# Kinetic — Desktop Motion-Graphics Video Engine

Kinetic is a desktop motion-graphics studio that programmatically generates After-Effects-style videos, SaaS product walkthroughs, and beat-synced animated clips using **Electron, React, and Remotion**.

![Kinetic Logo](kinetic_brand/logo_with_text.png)

---

## 🚀 Quick Start

Run Kinetic locally on your machine:

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Launch Electron Studio
npm run dev
```

---

## 🎯 Architectural Overview

Unlike traditional AI video generators that output blurry, warping pixels with corrupted text, Kinetic writes **deterministic React component code** compiled frame-by-frame by Remotion. This guarantees 4K crisp typography, sharp UI chrome, and hardware-accelerated rendering.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             KINETIC ENGINE                                  │
├───────────────────┬─────────────────────────────┬───────────────────────────┤
│ ELECTRON MAIN     │ REACT STUDIO UI             │ REMOTION VIDEO COMPILER   │
│ - IPC File System │ - MultiTrack Timeline       │ - 60 FPS Canvas Preview   │
│ - MP4 Exporter    │ - Targeted AI Comment Pins  │ - Monotonic Keyframe AST  │
│ - Native Audio    │ - DaVinci Audio Waveforms   │ - Hardware Render Pipeline│
└───────────────────┴─────────────────────────────┴───────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BEATNET AI MUSIC RHYTHM ENGINE                         │
│  STFT Spectrogram -> Song Loudness Normalization -> Frame Ooomph Ratings    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Core Features

* **BeatNet AI Music Beat & Ooomph Sync**: Automatically extracts STFT spectrogram magnitude features from audio soundtracks. Calculates song-relative loudness normalization to assign 10%–100% "Ooomph" impact ratings (Heavy, Medium, Subtle) to video keyframe transitions.
* **Targeted Comment-to-Edit Loop**: Pin feedback comments directly to specific frames on the timeline to scope AI edits exclusively to targeted visual elements.
* **DaVinci Resolve-Style Audio Track**: Integrated timeline audio track featuring vertical spectrum peak bar lines, mute controls (`M`), and beat marker overlays.
* **Hardware-Accelerated Morph Engine**: Interpolates numbers, hex colors, 3D perspective transforms, opacity, and vector bounds without writing manual math.
* **Primitives SDK**:
  - **12 UI Chrome**: `BrowserFrame`, `SidebarLayout`, `TopNavbar`, `MobileDevice`, etc.
  - **9 Transition Wrappers**: `SpringEnter`, `FadeBlur`, `SlideInOut`, `PerspectiveFlip`, etc.
  - **8 SVG Charts**: `Bar`, `Line`, `Pie`, `Area`, `Donut`, `Funnel`, `Scatter`, `Sparkline`.
  - **10 Card SDKs**: `GlassmorphicCard`, `PricingPlan`, `Kanban`, `CustomCard`, etc.

---

## 🧪 Automated Testing Suite

Kinetic includes a zero-dependency TypeScript test suite under `testing/`:

```bash
npm test
```

### Test Coverage:
1. **`testing/beatDetector.test.ts`**: Tests STFT spectrogram windowing, frame hop calculations, and song-relative loudness normalization (10%–100% intensity scale).
2. **`testing/semanticParser.test.ts`**: Tests Remotion keyframe frame deduplication (ensuring `f0 < f1 < f2` to prevent rendering crashes), property extraction, and TSX serialization.
3. **`testing/MorphSDK.test.ts`**: Tests numeric interpolation, hex color blending, and hardware-accelerated 3D transform generation.

---

## 🛠 Tech Stack

* **Desktop Application**: Electron & Node.js IPC
* **Frontend UI**: React 18, Tailwind CSS, Phosphor Icons
* **Video Rendering**: Remotion Engine & FFmpeg
* **Audio Analysis**: ONNX Runtime Web & Web Audio STFT
* **Testing**: Node Native Test Runner & `tsx`

---

## 📜 Credits

* [Remotion](https://www.remotion.dev) for rendering React components into video frames.
* [Electron](https://www.electronjs.org) for desktop application window management.
* [ONNX Runtime](https://onnxruntime.ai) & BeatNet for audio beat detection.
* [Phosphor Icons](https://phosphoricons.com) for interface iconography.
