import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { RenderProgress, ExportVideoOptions, RepoPackResult, TypecheckResult } from '../shared/ipc-types';

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

  packRepo: (source: string): Promise<RepoPackResult | null> =>
    ipcRenderer.invoke('pack-repo', source),

  verifyTypecheck: (): Promise<TypecheckResult> =>
    ipcRenderer.invoke('verify-typecheck'),

  getSystemFonts: (): Promise<string[]> =>
    ipcRenderer.invoke('get-system-fonts'),

  exportVideo: (options: ExportVideoOptions): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('export-video', options),

  renderVideo: (options: any): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('export-video', { compositionId: 'VideoComposition', fps: 30, width: 1920, height: 1080, framesPerScene: [300], ...options }),

  onRenderProgress: (
    callback: (progress: { frame: number; total: number; status?: string }) => void
  ): (() => void) => {
    const subscription = (_event: IpcRendererEvent, progress: any): void =>
      callback(progress);
    ipcRenderer.on('render-progress', subscription);
    return (): void => {
      ipcRenderer.removeListener('render-progress', subscription);
    };
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);