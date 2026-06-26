# Kinetic Design Guidelines

This document outlines the core design system and user interface standards for the **Kinetic** desktop engine client. Use these patterns when designing new screens, dialogs, and components to maintain a premium, cohesive, and modern user experience.

---

## 1. Color System

Kinetic uses a curated, high-contrast dark-mode color scheme. Avoid raw or generic colors.


| Token                 | CSS Class / Hex               | Use Case                                   |
| :-------------------- | :---------------------------- | :----------------------------------------- |
| **Base Canvas**       | `bg-gray-950` / `#030712`     | App-wide layout background                 |
| **Sidebar / Panels**  | `bg-gray-900` / `#0f172a`     | Workspace layout sidebars and menus        |
| **Primary Accent**    | `bg-indigo-600` / `#6366f1`   | Main CTAs, checked states, primary buttons |
| **Primary Hover**     | `bg-indigo-500` / `#8b5cf6`   | Highlight focus states and button hover    |
| **Subtle Borders**    | `border-gray-800` / `#1e293b` | Container lines, dividing borders          |
| **Card / Inside Box** | `bg-gray-950/50` / `#090d16`  | Nested elements, description boxes         |
| **Normal Text**       | `text-white` / `#ffffff`      | Titles, headers, prominent copy            |
| **Muted Text**        | `text-gray-400` / `#94a3b8`   | Subheadings, details, descriptions         |

---

## 2. Typography

We prioritize modern, readable, and premium sans-serif typefaces.

* **Primary Typeface:** `Inter`, `Outfit`, `Poppins` (Query local user fonts, fall back to standard system sans-serif).
* **Title Hierarchy:**
  * **H1 / Main Titles:** Bold, large tracking (`tracking-wide`), bright white.
  * **H3 / Section Headers:** Tiny, uppercase, semibold, muted gray (`text-gray-500 text-xs font-semibold uppercase tracking-wider`).
  * **Descriptions:** Regular weight, small/medium sizing, muted text.

---

## 3. Shapes & Layout Structures

* **Outer Containers:** All main panels and dialog containers use large rounded corners (`rounded-2xl` or `16px`).
* **Inner Components:** Buttons, text input boxes, and inner status boxes use medium rounded corners (`rounded-lg` or `rounded-xl`).
* **Glassmorphism:** To maintain a premium, layered aesthetic, use semi-transparent background color fills combined with backdrop blurs:
  * CSS: `background-color: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px);`
  * Tailwind: `bg-slate-900/85 backdrop-blur-md`
* **Glow Highlights:** Add drop shadow glows around focal branding points (like the logo icon) or primary action triggers using low-opacity primary colors:
  * Example: `filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.4))`

---

## 4. Buttons & Interactive States

* **Primary Buttons:** High-contrast solid indigo fill. Changes color smoothly on hover.
  * Classes: `bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors duration-150`
* **Secondary / Cancel Buttons:** Subtle border outline with slight dark fill.
  * Classes: `border border-gray-700 bg-gray-900/50 hover:bg-gray-800 text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors duration-150`
* **Transitions:** Always add transition durations to elements that change color or size (`transition-all duration-150 ease-out`).

---

## 5. Custom Modal & Alert Layout Rules

Every alert, warning, or confirmation modal in Kinetic must follow the wireframe structure from our specification but styled inside our premium dark mode design system:

1. **Outer Modal Window:** Centered inside a dim, semi-transparent backdrop overlay (`bg-black/75 backdrop-blur-sm`). Built as a `rounded-2xl` card with a sleek `border border-gray-800/80` and background `bg-gray-900/90`.
2. **Title Header (Top Left):** Standard bold header `text-white text-lg font-semibold tracking-wide mb-3`.
3. **Inner Details Box (Center Nested):** A secondary rounded container `rounded-xl border border-gray-800/50 bg-gray-950/60 p-4 text-sm text-gray-400 min-h-[90px] mb-5` that displays the alert details message.
4. **Action Buttons (Bottom Right):** Right-aligned button group with the secondary button (e.g. Cancel) on the left, and primary button (e.g. Ok) on the right.
