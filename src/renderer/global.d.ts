interface RenderProgress {
  frame: number;
  total: number;
  status: string;
  error?: string;
}

interface ExportVideoOptions {
  compositionId: string;
  outputPath: string;
  framesPerScene: number[];
  fps: number;
  width: number;
  height: number;
  props?: Record<string, unknown>;
}

interface ElectronAPI {
  readDirectory: (dirPath: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  selectDirectory: () => Promise<string | null>;
  getAppVersion: () => Promise<string>;
  selectFile: () => Promise<string | null>;
  showItemInFolder: (filePath: string) => Promise<boolean>;
  createDirectory: (dirPath: string) => Promise<boolean>;
  moveFile: (oldPath: string, newPath: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  deleteDirectory: (dirPath: string) => Promise<boolean>;
  scanRepo: (dirPath: string) => Promise<ScrapedFindings | null>;
  cloneScan: (gitPath: string) => Promise<ScrapedFindings | null>;
  packRepo: (source: string) => Promise<RepoPackResult | null>;
  verifyTypecheck: () => Promise<TypecheckResult>;
  getSystemFonts: () => Promise<string[]>;
  exportVideo: (options: ExportVideoOptions) => Promise<{ success: boolean; error?: string }>;
  renderVideo: (options: any) => Promise<{ success: boolean; error?: string }>;
  onRenderProgress: (
    callback: (event: any, progress: RenderProgress) => void
  ) => () => void;
}

interface Window {
  electronAPI?: ElectronAPI;
}

interface ScrapedFindings {
  routes: string[],
  components: string[],
  colors: string[],
  fonts: string[],
}

interface RepoPackResult {
  content: string,
  filePath: string,
  totalFiles: number,
  totalCharacters: number,
}

interface TypecheckError {
  line: number;
  message: string;
}

interface TypecheckResult {
  ran: boolean;
  errors: TypecheckError[];
}

declare module 'vader-sentiment';