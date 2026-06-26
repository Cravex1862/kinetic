interface ElectronAPI {
  readDirectory: (dirPath: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  selectDirectory: () => Promise<string | null>;
  getAppVersion: () => Promise<string>;
  selectFile: () => Promise<string>;
  showItemInFolder: (filePath: string) => Promise<boolean>;
  createDirectory: (dirPath: string) => Promise<boolean>;
  moveFile: (oldPath: string, newPath: string) => Promise<boolean>;
  deleteFile: (filePath: string) => Promise<boolean>;
  deleteDirectory: (dirPath: string) => Promise<boolean>;
  exportVideo: (options: {
    compositionId: string;
    outputPath: string;
    framesPerScene: number[];
    fps: number;
    width: number;
    height: number;
    props?: any;
  }) => Promise<{ success: boolean; error?: string }>;

  onRenderProgress: (callback: (event: any, progress: {
    frame: number; total: number; status: string; error?: string
  }) => void) => () => void;

}




interface Window {
  electronAPI?: ElectronAPI;
}
