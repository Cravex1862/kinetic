import React from 'react';
import { interpolate, Easing } from 'remotion';

// ─── Field types ──────────────────────────────────────────
export type MorphField =
  | { type: 'number' }
  | { type: 'color' }
  | { type: 'vec2' }
  | { type: 'boolean' }
  | { type: 'string' };

export type MorphSchema = Record<string, MorphField>;

export type EasingPreset = 'ease-in-out' | 'ease-in' | 'ease-out' | 'linear' | 'bounce';

// ─── Easing map ───────────────────────────────────────────
const easingFn: Record<EasingPreset, (t: number) => number> = {
  'ease-in-out': Easing.inOut(Easing.ease),
  'ease-in': Easing.in(Easing.ease),
  'ease-out': Easing.out(Easing.ease),
  linear: (t) => t,
  bounce: Easing.out(Easing.bounce),
};

// ─── Color utilities ──────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0,
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

// ─── Single value morph ────────────────────────────────────
export function morphValue(
  from: unknown,
  to: unknown,
  field: MorphField,
  progress: number,
): unknown {
  const p = Math.max(0, Math.min(1, progress));

  switch (field.type) {
    case 'number': {
      const a = Number(from ?? 0);
      const b = Number(to ?? 0);
      return a + (b - a) * p;
    }
    case 'color': {
      const a = hexToRgb(String(from ?? '#000000'));
      const b = hexToRgb(String(to ?? '#000000'));
      return rgbToHex(
        a[0] + (b[0] - a[0]) * p,
        a[1] + (b[1] - a[1]) * p,
        a[2] + (b[2] - a[2]) * p,
      );
    }
    case 'vec2': {
      const a = (from ?? { x: 0, y: 0 }) as { x: number; y: number };
      const b = (to ?? { x: 0, y: 0 }) as { x: number; y: number };
      return {
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
      };
    }
    case 'boolean': {
      return p < 0.5 ? from : to;
    }
    case 'string': {
      return p < 0.5 ? from : to;
    }
    default:
      return to;
  }
}

// ─── Full config morph ─────────────────────────────────────
export function applyMorphProps<T extends Record<string, unknown>>(
  from: T,
  to: T,
  schema: MorphSchema,
  progress: number,
  easing: EasingPreset = 'ease-in-out',
): T {
  const easedProgress = easingFn[easing](progress);
  const result: Record<string, unknown> = {};
  const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

  for (const key of allKeys) {
    const field = schema[key];
    if (field) {
      result[key] = morphValue(from[key], to[key], field, easedProgress);
    } else {
      result[key] = easedProgress < 0.5 ? from[key] : to[key];
    }
  }

  return result as T;
}

// ─── Hook ──────────────────────────────────────────────────
export function useMorph<T extends Record<string, unknown>>(
  from: T,
  to: T,
  schema: MorphSchema,
  frame: number,
  duration: number,
  easing: EasingPreset = 'ease-in-out',
): T {
  const progress = duration > 0 ? Math.min(frame / duration, 1) : 1;
  return applyMorphProps(from, to, schema, progress, easing);
}

// ─── Wrapper component ─────────────────────────────────────
interface MorphProps<T extends Record<string, unknown>> {
  from: T;
  to: T;
  schema: MorphSchema;
  frame: number;
  duration: number;
  easing?: EasingPreset;
  children: (resolved: T) => React.ReactNode;
}

export function Morph<T extends Record<string, unknown>>({
  from,
  to,
  schema,
  frame,
  duration,
  easing = 'ease-in-out',
  children,
}: MorphProps<T>): React.ReactNode {
  const resolved = useMorph(from, to, schema, frame, duration, easing);
  return children(resolved);
}
