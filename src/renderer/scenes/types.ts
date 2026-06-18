import type { EasingPreset } from '../primitives/MorphSDK';

export type KeyframeConfig = Record<string, unknown>;

export type UIActionType =
  | 'cursor-click'
  | 'scroll'
  | 'toggle'
  | 'menu-expand'
  | 'counter';

export interface UIAction {
  type: UIActionType;
  target: string;
  config: Record<string, unknown>;
}

export interface SceneDefinition {
  duration: number;
  easing: EasingPreset;
  from: KeyframeConfig;
  to: KeyframeConfig;
  narration: string;
  uiActions: UIAction[];
}
