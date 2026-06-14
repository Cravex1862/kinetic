interface ElectronAPI {
  readDirectory: (dirPath: string) => Promise<string[]>;
  readFile: (filePath: string) => Promise<string>;
  selectDirectory: () => Promise<string | null>;
  getAppVersion: () => Promise<string>;
}

interface Window {
  electronAPI: ElectronAPI;
}
