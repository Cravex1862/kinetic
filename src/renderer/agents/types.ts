export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "hackclub"
  | "ollama"
  | "lmstudio"
  | "local"
  | "byoc"
  | "groq";

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

// ─── Multi-Agent Pipeline Types ──────────────────────────────────────────────

export interface DesignTokens {
  fontFamily: string;
  primaryColor: string;
  secondaryColor?: string;
  accentColor: string;
  semanticColor?: string;
  errorColor?: string;
  successColor?: string;
  neutralColor?: string;
  textColor: string;
  backgroundColor: string;
  surfaceColor: string;
  theme: "dark" | "light";
}

export interface SceneBlueprint {
  id: string;
  purpose: string;
  durationInFrames: number;
  componentList: string[]; // visual section hints for the scene brief
}

export interface SceneCode {
  blueprintId: string;
  durationInFrames: number;
  sceneCode: string;
}

export interface PipelineState {
  status:
    | "idle"
    | "repoScan"
    | "designing"
    | "interviewing"
    | "storyboarding"
    | "sceneCreation"
    | "assembling"
    | "verifying"
    | "done"
    | "error";
  progress: number;
  currentScene?: string; // e.g. "scene2"
  error?: string;
  questions?: any[];
  blueprints?: SceneBlueprint[];
  sceneCodes?: SceneCode[];
  assembled?: string;
  finalCode?: string;
  designTokens?: DesignTokens;
}

export interface PipelineController {
  config: AgentConfig;
  onState: (state: PipelineState) => void;
  waitForApproval: () => Promise<unknown>;
  approveStage: (data?: unknown) => void;
}

export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-latest",
  google: "gemini-2.5-flash",
  hackclub: "qwen/qwen-2.5-coder-32b-instruct",
  ollama: "qwen2.5-coder",
  lmstudio: "qwen2.5-coder-7b-instruct",
  local: "qwen2.5-coder",
  byoc: "byoc",
  groq: "llama-3.3-70b-versatile",
};
