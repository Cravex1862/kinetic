import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

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

const electronAPI = {
  readDirectory: (dirPath: string): Promise<string[]> =>
    ipcRenderer.invoke('read-directory', dirPath),

  readFile: (filePath: string): Promise<string> =>
    ipcRenderer.invoke('read-file', filePath),

  writeFile: (filePath: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('write-file', filePath, content),

  selectDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('select-directory'),

  selectFile: (): Promise<string | null> =>
    ipcRenderer.invoke('select-file'),

  showItemInFolder: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('show-item-in-folder', filePath),

  getAppVersion: (): Promise<string> =>
    ipcRenderer.invoke('get-app-version'),

  createDirectory: (dirPath: string): Promise<boolean> =>
    ipcRenderer.invoke('create-directory', dirPath),

  moveFile: (oldPath: string, newPath: string): Promise<boolean> =>
    ipcRenderer.invoke('move-file', oldPath, newPath),

  deleteFile: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('delete-file', filePath),

  deleteDirectory: (dirPath: string): Promise<boolean> =>
    ipcRenderer.invoke('delete-directory', dirPath),

  scanRepo: (dirPath: string): Promise<any> =>
    ipcRenderer.invoke('scan-repo', dirPath),

  cloneScan: (gitPath: string): Promise<any> =>
    ipcRenderer.invoke('clone-scan', gitPath),

  getSystemFonts: (): Promise<string[]> =>
    ipcRenderer.invoke('get-system-fonts'),

  exportVideo: (options: ExportVideoOptions): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('export-video', options),

  onRenderProgress: (
    callback: (event: IpcRendererEvent, progress: RenderProgress) => void
  ): (() => void) => {
    const subscription = (event: IpcRendererEvent, progress: RenderProgress): void =>
      callback(event, progress);
    ipcRenderer.on('render-progress', subscription);
    return (): void => {
      ipcRenderer.removeListener('render-progress', subscription);
    };
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);