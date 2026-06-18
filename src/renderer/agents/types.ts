export type Provider = 'openai' | 'anthropic' | 'google' | 'hackclub';

export interface AgentConfig {
  provider: Provider;
  apiKey: string;
  model?: string;
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

export interface PipelineState {
  status: 'idle' | 'storyboarding' | 'laying-out' | 'animating' | 'copywriting' | 'compiling' | 'done' | 'error';
  progress: number;
  error?: string;
  output?: SceneOutput[];
}

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-latest',
  google: 'gemini-2.5-flash',
  hackclub: 'gemini-2.5-flash',
};
