import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  readDirectory: (dirPath: string): Promise<string[]> =>
    ipcRenderer.invoke('read-directory', dirPath),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('read-file', filePath),

  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('select-directory'),

  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-app-version'),

  exportVideo: (options: {
    compositionId: string;
    outputPath: string;
    framesPerScene: number[];
    fps: number;
    width: number;
    height: number;
  }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('export-video', options),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
