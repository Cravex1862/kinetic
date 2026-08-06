import * as fs from 'fs';
import * as path from 'path';

export function handleReadFile(filePath: string): string | null {
  try {
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

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
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

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
    const resolvedPath = path.isAbsolute(dirPath)
      ? dirPath
      : path.join(process.cwd(), dirPath);

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
