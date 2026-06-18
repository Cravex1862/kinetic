import type { SceneDefinition } from './types';
import type { MorphSchema } from '../primitives/MorphSDK';

export const TEST_SCHEMA: MorphSchema = {
  x: { type: 'number' },
  y: { type: 'number' },
  width: { type: 'number' },
  height: { type: 'number' },
  opacity: { type: 'number' },
  borderRadius: { type: 'number' },
  backgroundColor: { type: 'color' },
  scale: { type: 'number' },
};

export const TEST_SCENE_1: SceneDefinition = {
  duration: 30,
  easing: 'ease-in-out',
  from: {
    x: -200,
    y: 0,
    width: 200,
    height: 200,
    opacity: 0,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    scale: 0.8,
  },
  to: {
    x: 200,
    y: 0,
    width: 200,
    height: 200,
    opacity: 1,
    borderRadius: 24,
    backgroundColor: '#f97316',
    scale: 1.2,
  },
  narration: 'Watch as the element slides in from the left.',
  uiActions: [],
};

export const TEST_SCENE_2: SceneDefinition = {
  duration: 30,
  easing: 'ease-out',
  from: {
    x: 200,
    y: 50,
    width: 200,
    height: 200,
    opacity: 1,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    scale: 1,
  },
  to: {
    x: 200,
    y: -50,
    width: 400,
    height: 400,
    opacity: 0.3,
    borderRadius: 50,
    backgroundColor: '#8b5cf6',
    scale: 1.5,
  },
  narration: 'Now it grows larger and fades slightly.',
  uiActions: [],
};

export const TEST_SCENES: SceneDefinition[] = [TEST_SCENE_1, TEST_SCENE_2];
export const TEST_TOTAL_DURATION = 60;
