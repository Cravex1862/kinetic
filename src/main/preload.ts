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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
