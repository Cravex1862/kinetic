export type Provider = 'openai' | 'anthropic' | 'google' | 'hackclub' | 'ollama' | 'lmstudio' | 'local' | 'byoc' | 'groq';

export interface AgentConfig {
  provider: Provider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface StoryboardScene {
  id: string;
  description: string;
  duration: number;
  narration: string;
}

export interface Storyboard {
  scenes: StoryboardScene[];
}

export interface ComponentNode {
  type: string;
  props: Record<string, unknown>;
  children?: ComponentNode[];
}

export interface ComponentTree {
  components: ComponentNode[];
}

export interface AnimationKeyframe {
  component: string;
  from: Record<string, unknown>;
  to: Record<string, unknown>;
  duration: number;
  easing: string;
}

export interface AnimationPlan {
  keyframes: AnimationKeyframe[];
}

export interface SceneOutput {
  sceneId: string;
  description: string;
  duration: number;
  components: ComponentNode[];
  keyframes: AnimationKeyframe[];
  narration: string;
  captions: string[];
}

// ─── Multi-Agent Pipeline Types ──────────────────────────────────────────────

export interface DesignTokens {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  surfaceColor: string;
  theme: 'dark' | 'light';
}

export interface SceneBlueprint {
  id: string;
  purpose: string;
  durationInFrames: number;
  componentList: string[];  // primitive names e.g. ["BrowserFrame", "BarChartCard"]
}

export interface ComponentCode {
  primitiveName: string;
  rawJSX: string;      // output of Component Creator Agent
  animatedJSX: string; // output of Animator Agent
}

export interface SceneCode {
  blueprintId: string;
  durationInFrames: number;
  components: ComponentCode[];
}

export interface PipelineState {
  status:
    | 'idle'
    | 'designing'
    | 'storyboarding'
    | 'component-building'
    | 'animating'
    | 'assembling'
    | 'verifying'
    | 'done'
    | 'error';
  progress: number;
  currentScene?: string;    // e.g. "scene2"
  currentComponent?: string; // e.g. "BarChartCard"
  error?: string;
  output?: SceneOutput[];
}

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-latest',
  google: 'gemini-2.5-flash',
  hackclub: 'gemini-2.5-flash',
  ollama: 'qwen2.5-coder',
  lmstudio: 'qwen2.5-coder-7b-instruct',
  local: 'qwen2.5-coder',
  byoc: 'byoc',
  groq: 'llama-3.1-8b-instant',
};
