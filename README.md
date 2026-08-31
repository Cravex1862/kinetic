# Kinetic

Kinetic is a desktop app that makes motion graphics videos by writing React code and rendering it frame by frame. No generative video models. The text stays sharp because it is just React.

I built it because I wanted a way to make clean SaaS demos and logo animations without opening After Effects. It runs on Electron, the UI is React, and Remotion does the actual rendering. That combination is stubborn but it works.

![Kinetic logo](kinetic_brand/logo_with_text.png)

## Quick start

You need Node 20 and npm.

```bash
# install
npm install

# run tests
npm test

# open the desktop app
npm run dev
```

`npm run build` creates the installers in `releases`. The GitHub workflow builds on tag push.

## How it works

Each video is a set of React components. Remotion asks React for frame 0, then frame 1, and so on, up to 30 frames per second. Because it is code, a 4K export still has crisp type.

Electron has two sides. The main process can read and write files. The renderer process cannot. Every file operation goes through `window.electronAPI`, which is exposed in `src/main/preload.ts` and handled in `src/main/index.ts`. The types for that bridge live in `src/shared/ipc-types.ts`.

```
Electron main  ->  handles files, runs Remotion render, talks to the OS
React studio   ->  timeline, sidebar, preview, asks main to do the heavy work
Remotion       ->  takes the TSX scenes and draws each frame
```

For music, the app can run a small BeatNet model in the browser with ONNX. It reads the soundtrack, makes a spectrogram, and gives each beat a strength score. Those scores become keyframe timings.

## What it can make

Kinetic has a few starter flows. Each one writes its own `VideoComposition.tsx`.

* SaaS demo. Give it a repo path or a GitHub URL. The scanner reads routes, components, colors and fonts, then the pipeline writes a product walkthrough.
* Basic animation. A sandbox for any short clip. You set the prompt, colors, fonts, and optional voiceover or music.
* Logo animation. SVG only. Pick a preset like 3D spin or particle burst, upload an SVG, and it builds a 5 second reveal. It can use flubber for true SVG morphs.
* Studio. After a video is generated you can preview it, scrub the timeline, and fix a single scene.

The scenes use a small primitive kit in `src/renderer/primitives`. That kit has things like `BrowserFrame`, `SidebarLayout`, `BarChartCard`, `Cursor`, and a few wrappers for entering and exiting. The generated scenes import only `react` and `remotion`, plus `flubber` and icons where needed.

## Tests

There is a tiny test suite with no extra test framework.

```bash
npm test
```

It checks three things:

* Beat detection calculates frame hops and normalizes loudness to a 10 to 100 scale.
* The parser removes duplicate keyframes so `f0 < f1 < f2` and the export does not crash.
* The helpers blend numbers and hex colors and build 3D transforms.

The tests live in `testing/`. They run with the Node test runner through `tsx`.

## Stack

Electron 30, React 18, TypeScript in strict mode, Tailwind with utility classes only, Remotion 4. Audio runs with `onnxruntime-web` and `@xenova/transformers`. Icons are Phosphor.

## Credits

Remotion does the rendering. Electron makes it a desktop app. BeatNet provides the rhythm model. Phosphor provides the icons. I stitched them together and fixed the parts that broke at 2 a.m.
