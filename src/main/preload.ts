import { contextBridge, ipcRenderer } from 'electron';

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

  exportVideo: (options: {
    compositionId: string;
    outputPath: string;
    framesPerScene: number[];
    fps: number;
    width: number;
    height: number;
    props?: any;
  }): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('export-video', options),

  onRenderProgress: (callback: (event: any, progress: {
    frame: number;
    total: number;
    status: string
  }) => void) => {
    const subscription = (event: any, progress: any) => callback(event, progress);
    ipcRenderer.on('render-progress', subscription);
    return () => {
      ipcRenderer.removeListener('render-progress', subscription);
    }
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
