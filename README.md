# Kinetic

A desktop studio that translates user descriptions and narration scripts into professional, keyframed After-Effects-style videos with motion graphics and animations. **Note: This project is in active development and this is the first iteration being updated to GitHub**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the local Electron studio
npm run dev
```

## Features
- **4-Stage Automated Orchestration:** Automatically translates single-sentence prompts and raw narration scripts into structural layouts, keyframe transitions, and voiceover captions.
- **Interactive Component Inspector:** Modify parameters like size, border radius, colors, and switch toggles in real-time with automatic live updates on the timeline canvas.
- **The Morph Engine:** A keyframe interpolation system that calculates transitions between visual states (numbers, colors, vectors, and booleans) without requiring manual animation code.
- **Audio Waveform Integration:** Upload background music or voiceovers and sync visuals to a real-time reactive canvas timeline.
- **Production Video Compiler:** Compiles dynamic React nodes into high-fidelity MP4 files locally on your machine using Remotion.

---

## How to Run Locally 

### System Prerequisites
- **Node.js**: Version 18+ (20 recommended)
- **FFmpeg**: Must be installed on your system path (required by Remotion to compile React elements into video frames).

### Setup and Start 

1. Clone the repository and install the modules:
```bash
git clone https://github.com/Cravex1862/kinetic.git
cd kinetic
npm install
```

2. Start the development server and open the Electron studio window:
```bash
npm run dev
```
3. Set your API credentials in the Dashboard's settings panel to activate the generation pipeline.

---

## How it Works 

Kinetic is built using Electron, React, and Remotion. Unlike standard video generation engines that rely on pixel-warping neural video models, Kinetic approached video generation programmatically. It coordinates a pipeline of four distinct layout compilers (Manager, Layout, Animation, and Copywriter) to convert natural language instructions into declarative JSON node graphs.

These graphs are processed by our custom Morph Engine ([MorphSDK.tsx](src/renderer/primitives/MorphSDK.tsx)), which performs frame-accurate mathematical interpolation between component states. This guarantees that text remains razor-sharp, interfaces render without artifacting, and video files compile deterministically on the client machine using Remotion's command-line renderer.

---

## Credits & Acknowledgements

- Built on [Remotion](https://www.remotion.dev) for programmatic React video rendering.
- Desktop application wrapper powered by [Electron](https://www.electronjs.org).
- Interface iconography provided by [Phosphor Icons](https://phosphoricons.com).


