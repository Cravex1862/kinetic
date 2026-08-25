import type {
  RenderProgress,
  ExportVideoOptions,
  ScrapedFindings,
  RepoPackResult,
  TypecheckError,
  TypecheckResult,
} from '@/shared/ipc-types';

declare global {
  type RenderProgress = import('@/shared/ipc-types').RenderProgress;
  type ExportVideoOptions = import('@/shared/ipc-types').ExportVideoOptions;
  type ScrapedFindings = import('@/shared/ipc-types').ScrapedFindings;
  type RepoPackResult = import('@/shared/ipc-types').RepoPackResult;
  type TypecheckError = import('@/shared/ipc-types').TypecheckError;
  type TypecheckResult = import('@/shared/ipc-types').TypecheckResult;

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
    renderVideo: (options: ExportVideoOptions) => Promise<{ success: boolean; error?: string }>;
    onRenderProgress: (
      callback: (event: unknown, progress: RenderProgress) => void
    ) => () => void;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
