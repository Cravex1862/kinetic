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
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../kinetic_brand/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenu(null);

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
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
  ipcMain.handle('write-file', async (_event, filePath: string, content: string): Promise<boolean> => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (err: any) {
      console.error('Failed to write file:', err);
      return false;
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

  ipcMain.handle('export-video', async (_event, options): Promise<{ success: boolean; error?: string }> => {
    try {
      const { exec } = require('child_process');

      // Write a temporary props file so that Remotion gets all the layout and keyframe data
      const tempPropsPath = path.join(app.getPath('temp'), `kinetic_render_props_${Date.now()}.json`);
      fs.writeFileSync(tempPropsPath, JSON.stringify(options.props || {}));

      const cmd = `npx remotion render "src/renderer/Root.tsx" "${options.compositionId}" "${options.outputPath}" --width=${options.width} --height=${options.height} --fps=${options.fps} --props="${tempPropsPath}"`;

      console.log('Starting render command:', cmd);

      return new Promise((resolve) => {
        const renderProcess = exec(cmd, {
          cwd: app.getAppPath()
        }, (err: any, stdout: any, stderr: any) => {
          // Clean up the temporary file
          try {
            if (fs.existsSync(tempPropsPath)) {
              fs.unlinkSync(tempPropsPath);
            }
          } catch (e) {
            console.error('Failed to clean up temp props file:', e);
          }

          if (err) {
            console.error('Render Failed! Error:', stderr || err.message);
            resolve({ success: false, error: stderr || err.message });
          }
          else {
            console.log('Render Completed Successfully!');
            resolve({ success: true });
          }
        });

        renderProcess.stdout.on('data', (data: string) => {
          const text = data.trim();
          console.log(text);

          const match = text.match(/Rendered\s+(?:frame\s+)?(\d+)\s*\/(\d+)/i) ||
            text.match(/Rendered\s+(?:frame\s+)?(\d+)\s+\((\d+)\s+frames/i) ||
            text.match(/Rendered\s+(?:frame\s+)?(\d+)/i);
          if (match) {
            const currentFrame = parseInt(match[1], 10);
            const totalFrames = match[2] ? parseInt(match[2], 10) : 100;
            _event.sender.send('render-progress', {
              frame: currentFrame,
              total: totalFrames,
              status: 'rendering'
            });
          }
        });

        renderProcess.stderr.on('data', (data: string) => {
          console.warn(data.trim());
        });
      })
    }
    catch (err) {
      return { success: false, error: String(err) };
    }
  });
  ipcMain.handle('select-file', async (): Promise<string | null> => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{
        name: 'JSON Files',
        extensions: ['json']
      }],
    });
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0];
  });
  ipcMain.handle('show-item-in-folder', async (_event, filePath: string): Promise<boolean> => {
    try {
      const { shell } = require('electron');
      shell.showItemInFolder(filePath);
      return true;
    }
    catch {
      return false;
    }
  })
  ipcMain.handle('create-directory', async (_event, dirPath: string): Promise<boolean> => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {
          recursive: true
        })
      }
      return true;
    }
    catch (err) {
      console.error('Failed to create directory:', err);
      return false;
    }
  });

  ipcMain.handle('move-file', async (_event, oldPath: string, newPath: string): Promise<boolean> => {
    try {
      fs.renameSync(oldPath, newPath);
      return true;
    }
    catch (err) {
      console.error('Failed to move file:', err);
      return false;
    }
  });
  ipcMain.handle('delete-file', async (_event, filePath: string): Promise<boolean> => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    }
    catch (err) {
      console.error('Failed to delete file:', err);
      return false;
    }
  }
  );
  ipcMain.handle('delete-directory', async (_event, dirPath: string): Promise<boolean> => {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      return true;
    }
    catch (err) {
      console.error("Failed to delete directory", err);
      return false;
    }
  });

}


app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('auto-detect', 'false');

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
})
