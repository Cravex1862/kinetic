interface ElectronAPI {
  readDirectory: (dirPath: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
  selectDirectory: () => Promise<string | null>;
  getAppVersion: () => Promise<string>;
  exportVideo: (options: {
    compositionId: string;
    outputPath: string;
    framesPerScene: number[];
    fps: number;
    width: number;
    height: number;
  }) => Promise<{ success: boolean; error?: string }>;
}

interface Window {
  electronAPI?: ElectronAPI;
}
