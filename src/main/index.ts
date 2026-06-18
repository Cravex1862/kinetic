import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { error } from 'console';
import { stdout } from 'process';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#030712',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle('read-directory', async (_event, dirPath: string): Promise<string[]> => {
    try {
      return fs.readdirSync(dirPath);
    } catch {
      return [];
    }
  });

  ipcMain.handle('read-file', async (_event, filePath: string): Promise<string> => {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return '';
    }
  });

  ipcMain.handle('select-directory', async (): Promise<string | null> => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });

  ipcMain.handle('get-app-version', (): string => {
    return app.getVersion();
  });

  ipcMain.handle('export-video', async (_event, options): Promise<{ success: boolean; error?: string}> => {
    try{
      const {exec} = require('child_process');
      const cmd = `npx remotion render src/render/Root.tsx ${options.compositionId}${options.outputPath} --width=${options.width} --height=${options.height} --fps=${options.fps}`;

      return new Promise((resolve) => {
        exec(cmd, {
          cwd:app.getAppPath() }, (err: any, stdout: any, stderr: any) => {
            if (err){
              resolve({success:false, error:stderr || err.message});

            }
            else{
              resolve({ success: true });
            }
          }
      )
      })
    }
    catch (err){
      return { success: false, error : String(err)};
    }
  }   );


app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})}
