import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

/**
 * Resolves relative file paths to the project root.
 * Uses app.getAppPath() which reliably points to the project root in dev mode,
 * unlike process.cwd() which can vary depending on how Electron was launched.
 */
function resolveToProjectRoot(filePath: string): string {
  if (path.isAbsolute(filePath)) return filePath;
  return path.join(app.getAppPath(), filePath);
}

export function handleReadFile(filePath: string): string | null {
  try {
    const resolvedPath = resolveToProjectRoot(filePath);

    if (fs.existsSync(resolvedPath)) {
      return fs.readFileSync(resolvedPath, 'utf-8');
    }
    return null;
  } catch (error) {
    console.error(`[fileService] Failed to read file ${filePath}:`, error);
    return null;
  }
}

export function handleWriteFile(filePath: string, content: string): boolean {
  try {
    const resolvedPath = resolveToProjectRoot(filePath);

    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(resolvedPath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`[fileService] Failed to write file ${filePath}:`, error);
    return false;
  }
}

export function handleListProjects(dirPath: string): string[] {
  try {
    const resolvedPath = resolveToProjectRoot(dirPath);

    if (!fs.existsSync(resolvedPath)) {
      return [];
    }

    const files = fs.readdirSync(resolvedPath);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join(resolvedPath, file));
  } catch (error) {
    console.error(`[fileService] Failed to list projects in ${dirPath}:`, error);
    return [];
  }
}
