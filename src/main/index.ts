import { app, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron'; // Imports electron and its controls to communicate with a desktop application.
import * as path from 'path'; // Imports node path utility to find system folders and across multiple OS'
import * as fs from 'fs'; // Imports node file system utility to interact with files on the disk.
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ExportVideoOptions, RepoPackResult, ScrapedFindings } from '../shared/ipc-types';

const execPromise = promisify(exec);


let mainWindow: BrowserWindow | null = null; //create a variable to hold the main dekstop window for it not to get closed automatically.

function createWindow(): void { // creates a desktop window
  let appIcon = undefined; // creates a variable for the taskbar icon
  try { // wraps the icon loader in a try-catch block so that if it doesnt find the image it doesnt crash.
    const iconPath = path.join(__dirname, '../../kinetic_brand/logo.png'); // get the file path for the logo icon image
    if (fs.existsSync(iconPath)) { // if the logo exists then
      appIcon = nativeImage.createFromPath(iconPath); // set the apps icon as the icon path that was retrieved
    }
  } catch (e) { // if it failes then
    console.error("Failed to load window icon:", e); // output a console error
  }

  mainWindow = new BrowserWindow({ // creates a new browser window with following properties:
    title: 'kinetic',
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#030712',
    autoHideMenuBar: true,
    icon: appIcon,
    webPreferences: { // configure system permissions for the webpae inside the window
      preload: path.join(__dirname, 'preload.js'), // run a preload script to let the front end use desktop functions.
      contextIsolation: true, // isolate the javascript front end from the backened for security
      nodeIntegration: false, // doesn't let the frontend access nodejs to prevent security vulnerabilties
      sandbox: false, // turns off sandbox so the preload script can access node js features
    },
  });

  mainWindow.setMenu(null); // removes the top bar with |file|edit|view 

  const isDev = !app.isPackaged; // determines if the app is in development or production

  if (isDev) { // if its in dev mode 
    mainWindow.loadURL('http://127.0.0.1:5173'); //load the vite local host url
    mainWindow.webContents.openDevTools(); // open chromium devtools
  } else { // if not
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')); //load the html file
  }

  mainWindow.on('destroyed', () => { // when closed
    mainWindow = null; // close the window
  });
}

import { handleReadFile, handleWriteFile, handleListProjects } from './fileService';

function registerIpcHandlers(): void {
  ipcMain.handle('read-directory', async (_event: Electron.IpcMainInvokeEvent, dirPath: string): Promise<string[]> => {
    try {
      return fs.readdirSync(dirPath);
    } catch {
      return [];
    }
  });

  ipcMain.handle('read-file', async (_event: Electron.IpcMainInvokeEvent, filePath: string): Promise<string> => {
    return handleReadFile(filePath) || '';
  });

  ipcMain.handle('write-file', async (_event: Electron.IpcMainInvokeEvent, filePath: string, content: string): Promise<boolean> => {
    return handleWriteFile(filePath, content);
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

  ipcMain.handle('export-video', async (_event: Electron.IpcMainInvokeEvent, options: ExportVideoOptions): Promise<{ success: boolean; error?: string }> => {
    try {
      // Write a temporary props file so that Remotion gets all the layout and keyframe data
      const tempPropsPath = path.join(app.getPath('temp'), `kinetic_render_props_${Date.now()}.json`);
      const totalDuration = Array.isArray(options.framesPerScene)
        ? options.framesPerScene.reduce((sum: number, f: number) => sum + f, 0)
        : undefined;
      fs.writeFileSync(tempPropsPath, JSON.stringify({
        ...(options.props || {}),
        ...(totalDuration != null ? { totalDuration } : {}),
        ...(options.props?.bgSelection != null ? { bgSelection: options.props.bgSelection } : {}),
      }));

      const cmd = `npx remotion render "src/renderer/Root.tsx" "${options.compositionId}" "${options.outputPath}" --width=${options.width} --height=${options.height} --fps=${options.fps} --props="${tempPropsPath}"`;

      console.log('Starting render command:', cmd);

      return new Promise((resolve) => {
        const renderProcess = exec(cmd, {
          cwd: app.getAppPath()
        }, (err: Error | null, _stdout: string, stderr: string) => {
          // Clean up the temporary file
          try {
            if (fs.existsSync(tempPropsPath)) {
              fs.unlinkSync(tempPropsPath);
            }
          } catch (e: unknown) {
            console.error('Failed to clean up temp props file:', e instanceof Error ? e.message : e);
          }

          if (err) {
            console.error('Render Failed! Error:', stderr || err.message);
            resolve({ success: false, error: stderr || err.message });
          } else {
            console.log('Render Completed Successfully!');
            resolve({ success: true });
          }
        });

        const handleChunk = (chunk: string) => {
          const text = chunk.trim();
          if (!text) return;
          console.log('[Remotion Output]:', text);

          const match = text.match(/(?:Rendered|Rendering|frame)\s*(\d+)\s*(?:\/|of)\s*(\d+)/i) ||
            text.match(/(\d+)\s*\/\s*(\d+)/) ||
            text.match(/Rendered\s+(\d+)/i);

          if (match) {
            const currentFrame = parseInt(match[1], 10);
            const totalFrames = match[2] ? parseInt(match[2], 10) : 300;
            _event.sender.send('render-progress', {
              frame: currentFrame,
              total: totalFrames,
              status: 'rendering'
            });
          }
        };

        renderProcess.stdout.on('data', (data: string) => handleChunk(data));
        renderProcess.stderr.on('data', (data: string) => handleChunk(data));
      });
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle('get-system-fonts', async (): Promise<string[]> => {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execPromise('powershell -Command "Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families.Name"');
        return stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      } else if (process.platform === 'darwin') {
        const { stdout } = await execPromise("system_profiler SPFontsDataType | grep 'Family:' | cut -d: -f2");
        return stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      } else {
        const { stdout } = await execPromise("fc-list : family | sort -u | cut -d, -f1");
        return stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      }
    } catch (err: unknown) {
      console.error('Failed to retrieve system fonts:', err);
      return ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Trebuchet MS', 'Impact'];
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

  ipcMain.handle('show-item-in-folder', async (_event: Electron.IpcMainInvokeEvent, filePath: string): Promise<boolean> => {
    try {
      const { shell } = require('electron');
      shell.showItemInFolder(filePath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('create-directory', async (_event: Electron.IpcMainInvokeEvent, dirPath: string): Promise<boolean> => {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {
          recursive: true
        });
      }
      return true;
    } catch (err: unknown) {
      console.error('Failed to create directory:', err instanceof Error ? err.message : err);
      return false;
    }
  });

  ipcMain.handle('move-file', async (_event: Electron.IpcMainInvokeEvent, oldPath: string, newPath: string): Promise<boolean> => {
    try {
      fs.renameSync(oldPath, newPath);
      return true;
    } catch (err: unknown) {
      console.error('Failed to move file:', err instanceof Error ? err.message : err);
      return false;
    }
  });

  ipcMain.handle('delete-file', async (_event: Electron.IpcMainInvokeEvent, filePath: string): Promise<boolean> => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (err: unknown) {
      console.error('Failed to delete file:', err instanceof Error ? err.message : err);
      return false;
    }
  });

  ipcMain.handle('delete-directory', async (_event: Electron.IpcMainInvokeEvent, dirPath: string): Promise<boolean> => {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      return true;
    } catch (err: unknown) {
      console.error("Failed to delete directory:", err instanceof Error ? err.message : err);
      return false;
    }
  });

  const scanDirectoryHelper = (dirPath: string): ScrapedFindings => {
    const findings: ScrapedFindings = {
      routes: [],
      components: [],
      colors: [],
      fonts: [],
    }
    if (fs.existsSync(dirPath)) {

      const contents: string[] = fs.readdirSync(dirPath);
      for (let n = 0; n < contents.length; n++) {
        const fullPath = path.join(dirPath, contents[n]);

        try {
          if (fs.statSync(fullPath).isDirectory()) {
            if (contents[n] !== 'node_modules' && contents[n] !== '.git' && contents[n] !== 'dist') {
              const sub = scanDirectoryHelper(fullPath);

              sub.routes.forEach(r => {
                if (!findings.routes.includes(r)) findings.routes.push(r);
              });

              sub.components.forEach(c => {
                if (!findings.components.includes(c)) findings.components.push(c);
              });

              sub.colors.forEach(col => {
                if (!findings.colors.includes(col)) findings.colors.push(col);
              });

              sub.fonts.forEach(f => {
                if (!findings.fonts.includes(f)) findings.fonts.push(f);
              });
            }
          }
          else {
            const fileContent = fs.readFileSync(fullPath, 'utf-8');

            if (fullPath.includes('pages') || fullPath.includes('views')) {
              const cleanRoute = '/' + contents[n].replace(/\.[jt]sx?$/, '').toLowerCase();
              if (!findings.routes.includes(cleanRoute)) findings.routes.push(cleanRoute);
            }

            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
              const componentMatches = fileContent.match(/export\s+(?:const|function|class)\s+([A-Z]\w*)/g);
              if (componentMatches) {
                componentMatches.forEach(match => {
                  const name = match.split(/\s+/).pop();
                  if (name && !findings.components.includes(name)) findings.components.push(name);
                });
              }
            }

            if (fullPath.endsWith('.css') || fullPath.includes('tailwind')) {
              const colorMatches = fileContent.match(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/gi);
              if (colorMatches) {
                colorMatches.forEach(color => {
                  let hex = color.toLowerCase();
                  // Expand 3-digit hex color codes to 6-digit codes to prevent duplicate listings
                  if (hex.length === 4) {
                    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
                  }
                  if (!findings.colors.includes(hex)) findings.colors.push(hex);
                });
              }

              const fontMatches = fileContent.match(/font-family:\s*['"]?([a-zA-Z0-9\s, -]+)['"]?/gi);
              if (fontMatches) {
                fontMatches.forEach(font => {
                  const family = font.replace(/font-family:\s*/i, '').replace(/['"]/g, '').split(',')[0].trim();
                  // Check if the family name contains common system UI or generic font fallback keywords
                  const isSystemFont = family.startsWith('-') || 
                                       family.includes('system') || 
                                       family.includes('sans-serif') || 
                                       family.includes('serif') || 
                                       family.includes('Segoe') || 
                                       family.includes('Arial') || 
                                       family.includes('Helvetica') || 
                                       family.includes('BlinkMac') || 
                                       family.includes('var') || 
                                       family.includes('Fallback') || 
                                       family.includes('monospace');
                  // Validate the family name is not a variable, inherit keyword, or system font override
                  if (family && family !== 'var' && !family.startsWith('--') && !family.startsWith('inherit') && !isSystemFont && !findings.fonts.includes(family)) {
                    findings.fonts.push(family);
                  }
                });
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return findings;
  };

  ipcMain.handle('scan-repo', async (_event: Electron.IpcMainInvokeEvent, dirPath: string): Promise<ScrapedFindings | null> => {
    let targetPath = dirPath;
    if (!targetPath) {
      if (!mainWindow) return null;
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      targetPath = result.filePaths[0];
    }

    try {
      return scanDirectoryHelper(targetPath);
    } catch (e: unknown) {
      console.error('Failed to scan repo:', e instanceof Error ? e.message : e);
      return null;
    }
  });

  ipcMain.handle('clone-scan', async (_event: Electron.IpcMainInvokeEvent, gitPath: string): Promise<ScrapedFindings | null> => {
    try {
      const tempPath = path.join(app.getPath('temp'), `kinetic_clone_${Date.now()}`);
      fs.mkdirSync(tempPath, { recursive: true });
      await execPromise(`git clone --depth 1 "${gitPath}" "${tempPath}"`);
      const results = scanDirectoryHelper(tempPath);
      fs.rmSync(tempPath, { recursive: true, force: true });
      return results;
    } catch (e: unknown) {
      console.error('Failed to clone and scan git repo:', e instanceof Error ? e.message : e);
      return null;
    }
  });

  const GIT_URL_PATTERN = /^(?:https?:\/\/|git@|ssh:\/\/)/i;

  const runRepomixOnDirectory = async (targetDir: string): Promise<RepoPackResult> => {
    const workDir = path.join(app.getPath('temp'), `kinetic_repomix_${Date.now()}`);
    fs.mkdirSync(workDir, { recursive: true });
    const outputFile = path.join(workDir, 'repomix-output.xml');

    try {
      await execPromise(
        `npx -y repomix@latest --style xml --output "${outputFile}" "${targetDir}"`,
        { timeout: 300000, maxBuffer: 10 * 1024 * 1024 }
      );
      if (!fs.existsSync(outputFile)) {
        throw new Error('repomix did not produce an output file');
      }
      const content = fs.readFileSync(outputFile, 'utf-8');
      const totalFiles = (content.match(/<file path=/g) ?? []).length;
      return {
        content,
        filePath: outputFile,
        totalFiles,
        totalCharacters: content.length
      };
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  };

  ipcMain.handle('pack-repo', async (_event: Electron.IpcMainInvokeEvent, source: string): Promise<RepoPackResult | null> => {
    try {
      let targetDir = source.trim();
      let clonedTempDir: string | null = null;

      if (GIT_URL_PATTERN.test(targetDir)) {
        clonedTempDir = path.join(app.getPath('temp'), `kinetic_pack_clone_${Date.now()}`);
        fs.mkdirSync(clonedTempDir, { recursive: true });
        await execPromise(`git clone --depth 1 "${targetDir}" "${clonedTempDir}"`);
        targetDir = clonedTempDir;
      }

      if (!fs.existsSync(targetDir)) {
        console.error(`pack-repo: target directory not found: ${targetDir}`);
        return null;
      }

      try {
        return await runRepomixOnDirectory(targetDir);
      } finally {
        if (clonedTempDir) {
          fs.rmSync(clonedTempDir, { recursive: true, force: true });
        }
      }
    } catch (e: unknown) {
      console.error('Failed to pack repo with repomix:', e instanceof Error ? e.message : e);
      return null;
    }
  });

  ipcMain.handle('verify-typecheck', async (): Promise<{ ran: boolean; errors: { line: number; message: string }[] }> => {
    try {
      const projectRoot = app.isPackaged ? app.getAppPath() : process.cwd();
      const { stdout } = await execPromise('npx tsc -p tsconfig.json --noEmit --pretty false', {
        cwd: projectRoot,
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      });
      return { ran: true, errors: [] };
    } catch (err: unknown) {
      const e = err as { stdout?: string; killed?: boolean; message?: string };
      if (e?.killed) {
        console.error('verify-typecheck: timed out');
        return { ran: false, errors: [{ line: 0, message: 'TypeScript check timed out' }] };
      }
      const stdout = e?.stdout || '';
      if (!stdout) {
        console.error('verify-typecheck: failed to run tsc:', e?.message);
        return { ran: false, errors: [] };
      }
      const target = 'src/renderer/scenes/VideoComposition.tsx';
      const errors: { line: number; message: string }[] = [];
      for (const line of stdout.split(/\r?\n/)) {
        if (!line.includes(target)) continue;
        const m = line.match(/:(\d+):\d+:\s*error\s+TS\d+:\s*(.*)$/);
        if (m) errors.push({ line: Number(m[1]), message: m[2] });
      }
      return { ran: true, errors };
    }
  });
}


app.commandLine.appendSwitch('no-proxy-server'); // turn off network proxy servers to speed up local web APi requests
app.commandLine.appendSwitch('auto-detect', 'false'); // disable automatic prox detection to bypass setup delay

app.whenReady().then(() => { // when the app is ready then:
  registerIpcHandlers(); //register all ipcHandlers
  createWindow(); // create the window

  app.on('activate', () => { // listen for clicking of app icon
    if (BrowserWindow.getAllWindows().length === 0) { // if all windows were closed
      createWindow(); // create window again
    }
  });
});

app.on('window-all-closed', () => { // listen for all windows being closed
  if (process.platform !== 'darwin') { // if its not darwin (macOS)
    app.quit(); // fully close the application
  }
})
