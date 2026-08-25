export interface RenderProgress {
  frame: number;
  total: number;
  status: string;
  error?: string;
}

export interface ExportVideoOptions {
  compositionId: string;
  outputPath: string;
  framesPerScene: number[];
  fps: number;
  width: number;
  height: number;
  props?: Record<string, unknown>;
}

export interface ScrapedFindings {
  routes: string[];
  components: string[];
  colors: string[];
  fonts: string[];
}

export interface RepoPackResult {
  content: string;
  filePath: string;
  totalFiles: number;
  totalCharacters: number;
}

export interface TypecheckError {
  line: number;
  message: string;
}

export interface TypecheckResult {
  ran: boolean;
  errors: TypecheckError[];
}
