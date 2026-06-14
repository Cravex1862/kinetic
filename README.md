# kinetic

![version](https://img.shields.io/badge/version-1.0.0-green)

kinetic is a versatile React component library crafted for building dynamic user interfaces, interactive demos, and engaging video content. It offers a rich collection of UI primitives, including various cards, charts, motion effects, structural layouts, and transitions. This toolkit is designed to streamline the creation of visually compelling experiences, whether for web applications, desktop apps via Electron, or high-quality video productions with Remotion.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Scripts](#scripts)
- [File Tree](#file-tree)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install
```

## Usage

To generate a README for your project using `readmegen`, navigate to your project's root directory or specify a path. API keys for AI providers should be set as environment variables (e.g., `GOOGLE_API_KEY`, `OPENAI_API_KEY`).

```bash
readmegen [path] [options]
```

**Positional Argument:**
*   `path`: The root directory of the project to generate a README for. Defaults to the current directory (`.`).

**Options:**
*   `--no-ai`: Generate the README without using AI, relying solely on static project analysis.
*   `--output`, `-o`: Specify the output file path for the generated README. Defaults to `README.md` in the project root.
*   `--overwrite`: Overwrite an existing README file if one is found at the output path.
*   `--provider`: Choose the AI provider to use (e.g., `openai`, `google`).
*   `--model`: Specify the AI model to use with the chosen provider (e.g., `gpt-4o`, `gemini-pro`).
*   `--help`: Display help information for the `readmegen` command.

## API Reference

### src/renderer/primitives/CardSDK.tsx

| Name | Type |
|------|------|
| `CustomCard` | const |
| `GlassmorphicCard` | const |
| `ProfileHeaderCard` | const |
| `FeatureBenefitCard` | const |
| `PricingPlanCard` | const |
| `KanbanTaskCard` | const |
| `BillingInvoiceCard` | const |
| `SettingsToggleCard` | const |
| `PushNotificationToast` | const |

### src/renderer/primitives/ChartsSDK.tsx

| Name | Type |
|------|------|
| `BarChart` | const |
| `LineChart` | const |
| `PieChart` | const |
| `AreaChart` | const |
| `DonutChart` | const |
| `MetricFunnel` | const |
| `ScatterPlot` | const |
| `SparklineTicker` | const |

### src/renderer/primitives/MotionSDK.tsx

| Name | Type |
|------|------|
| `Cursor` | const |
| `SmoothScroll` | const |
| `FocusZoom` | const |
| `TextTyper` | const |
| `ChartAnimate` | const |
| `DragAndDrop` | const |
| `TypingGhostCursor` | const |
| `MarqueeTrack` | const |
| `ProgressRing` | const |

### src/renderer/primitives/StructuralSDK.tsx

| Name | Type |
|------|------|
| `BrowserFrame` | const |
| `AppCanvas` | const |
| `MockWindow` | const |
| `SidebarLayout` | const |
| `DataGridContainer` | const |
| `TopNavbar` | const |
| `HeroMetricCard` | const |
| `ActionButton` | const |
| `SplitHeroLayout` | const |
| `TabSwitcherContainer` | const |
| `BreadcrumbHeader` | const |
| `NotificationToaster` | const |

### src/renderer/primitives/TransitionSDK.tsx

| Name | Type |
|------|------|
| `SpringEnter` | const |
| `StaggerContainer` | const |
| `FadeBlur` | const |
| `SlideInOut` | const |
| `CardReveal` | const |
| `PulseScale` | const |
| `AccordionExpand` | const |
| `RotateFlip` | const |
| `GlitchIntro` | const |

### src/renderer/primitives/types.ts

| Name | Type |
|------|------|
| `configToStyle` | function |
| `GlowConfig` | type |
| `StyleConfig` | type |


## Scripts

| Script | Command |
|--------|---------|
| `dev` | `concurrently -k "vite" "tsc -p tsconfig.node.json --watch" "wait-on http://localhost:5173 && electron ."` |
| `build` | `tsc -p tsconfig.node.json && vite build` |
| `preview` | `npx remotion preview src/renderer/Root.tsx` |


## File Tree

```
SaaS Video Demos/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   └── preload.ts
│   └── renderer/
│       ├── primitives/
│       │   ├── CardSDK.tsx
│       │   ├── ChartsSDK.tsx
│       │   ├── MotionSDK.tsx
│       │   ├── StructuralSDK.tsx
│       │   ├── TransitionSDK.tsx
│       │   └── types.ts
│       ├── DemoPage.tsx
│       ├── global.d.ts
│       ├── index.css
│       ├── main.tsx
│       └── Root.tsx
├── AGENTS.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Dependencies

| Package | Version |
|---------|---------|
| `react` | `^18.2.0` |
| `react-dom` | `^18.2.0` |
| `remotion` | `^4.0.0` |
| `@phosphor-icons/react` | `^2.1.0` |


## Troubleshooting

*   **Missing API Key:** Ensure that the necessary API key for your chosen AI provider (e.g., `GOOGLE_API_KEY`, `OPENAI_API_KEY`) is correctly set as an environment variable before running `readmegen`.
*   **Wrong Provider:** If you're encountering issues with AI generation, verify that the `--provider` option matches the AI service you intend to use and for which you have an API key configured.
*   **Bad Path:** Double-check the `path` argument provided to `readmegen`. It should point to the correct root directory of your project. If omitted, it defaults to the current working directory, so ensure you run the command from the project's root or specify the path explicitly.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

_(Add license information here)_

---

_README generated by [readmegen](https://github.com/Cravex1862/readmegen) on 2026-06-14_