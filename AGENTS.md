# AGENTS.md - AI Developer Guidance Specs

## 💡 System Context & Core Project Purpose
This application is a specialized desktop orchestration harness designed to enable AI models to automatically generate high-fidelity, premium SaaS product video demos. Rather than relying on generic, non-deterministic video-generation models that warp text and distort interface designs, this system utilizes a highly precise **multi-subagent architecture** running natively on **Electron, React, and Remotion**.

The application operates by running an automated Abstract Syntax Tree (AST) scraper through a target software codebase via Electron's native file-system access layer to map out routes, design tokens, configurations, and core UI features. A high-level Manager Agent converts this semantic architectural map into a detailed storyboard timeline. Specialized code-generation sub-agents (Layout, Animation, and Copywriting personas) then autonomously construct and assemble the video frame-by-frame by writing raw React code. Crucially, their layout capabilities are strictly bounded by an internal, highly deterministic code framework: the **Primitives SDK**. 

By forcing the generation agents to compile scenes exclusively using these standardized building blocks, the system ensures pixel-perfect asset layouts, smooth hardware-accelerated animations, fluid spring-physics transitions, and real-time user customization (tweaking brand colors, typography scales, neon glows, and animation speed intervals) directly inside the desktop studio canvas preview before running a local **FFmpeg** execution thread to export a final, high-bitrate `.mp4` file.

---

## 🛠️ Development Lifecycles & Terminal Commands
Use these explicit execution scripts to run, test, or check compilation status within the local workspace environment:
* **Install System Dependencies:** `npm install`
* **Launch Desktop App Studio (Development Mode):** `npm run dev`
* **Compile & Build Application Executables:** `npm run build`
* **Isolate & Preview Remotion Canvas Studio:** `npx remotion preview src/renderer/Root.tsx`

---

## 🗺️ Repository Architecture Map
Familiarize yourself with the system directory layout before implementing or editing files:
* `/src/main/` ──► Electron main process loop (handles local file system operations, target repository directory indexing, and third-party configuration file ingestion).
* `/src/renderer/` ──► React application desktop frontend workspace interface.
* `/src/renderer/primitives/` ──► The foundational building blocks of the entire rendering ecosystem. Contains three explicit sub-SDK files:
  * `StructuralSDK.tsx`: Handles physical UI layouts (e.g., `<BrowserFrame>`, `<TopNavbar>`, `<HeroMetricCard>`) with integrated, universal, hardware-accelerated neon backdrop shadows via a custom `GlowConfig` object interface.
  * `TransitionSDK.tsx`: Manages timing thresholds, entry/exit vectors, and spring physics properties wrapping child elements.
  * `MotionSDK.tsx`: Orchestrates action layer animations (e.g., interpolated Bezier cursor tracks, text typewriter outputs, smooth frame overflow scrolling, and target element focus-zooming).
* `/src/renderer/Root.tsx` ──► The core composition matrix entrypoint where Remotion tracks, scales, sequences, and registers timeline metadata for final video rendering.

---

## 🛑 Strict Generation Guardrails & Coding Conventions
When generating code or processing files within this codebase, you MUST adhere to these ironclad constraints:
1. **The Primitives-Only Rule:** When writing code designed to construct video scenes, you are strictly FORBIDDEN from inventing custom HTML structures, writing raw CSS animation keyframe chains, or importing unapproved UI elements. You must **exclusively** compose layouts using components provided by the internal Primitives SDKs. Breaking this rule causes immediate timeline desynchronization and compilation failure during video export.
2. **Strict Mode TypeScript:** All code components must be strongly typed without resorting to generic `any` type declarations.
3. **Styling Paradigm:** Use clean utility formatting layout classes via Tailwind CSS exclusively.
4. **IPC Context Separation:** The React renderer UI context has no direct file-system execution access. You must securely route all repository code scraping requests or local system directory searches through the established `window.electronAPI` Inter-Process Communication channels.