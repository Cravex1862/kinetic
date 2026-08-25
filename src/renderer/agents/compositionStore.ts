export const COMPOSITION_PATH = "src/renderer/scenes/VideoComposition.tsx";

export function sceneExportName(index: number): string {
  return `Scene${index + 1}`;
}

export function sceneExportRegex(): RegExp {
  return /export\s+const\s+(Scene\d+)\s*[=:]/g;
}

export function isValidSceneCode(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;
  return /export\s|<[A-Za-z]/.test(trimmed);
}

export function stripAllImports(code: string): string {
  if (!code) return "";
  return code
    .replace(/^import\s+[\s\S]*?;/gm, "")
    .replace(/^import\s+.*?from\s+['"].*?['"];?/gm, "")
    .trim();
}

export function normalizeSceneExportName(code: string, sceneName: string): string {
  const exportMatch = code.match(
    /export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/,
  );
  if (exportMatch) {
    const current = exportMatch[1];
    if (current === sceneName) return code;
    return code.replace(exportMatch[0], `export const ${sceneName}`);
  }
  const defaultMatch = code.match(/export\s+default\s+(?:function\s+)?([A-Za-z_$][\w$]*)?/);
  if (defaultMatch && defaultMatch[1]) {
    return code.replace(defaultMatch[0], `export const ${sceneName}`);
  }
  return `export const ${sceneName}: React.FC = () => (\n<>\n${code}\n</>\n);`;
}

export function makePlaceholderScene(sceneName: string, purpose: string): string {
  const label = purpose.replace(/[<>`{}]/g, "").trim().slice(0, 60) || "Scene";
  return `export const ${sceneName}: React.FC = () => (
  <div style={{ width: '100%', height: '100%', backgroundColor: '#0b0b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: '#64748b', fontFamily: 'Inter, sans-serif', fontSize: 28 }}>{label}</div>
  </div>
);`;
}

export function extractCodeBlock(code: string): string {
  if (!code) return "";
  const blockMatch = code.match(/```(?:tsx|jsx|ts|js)?\s*([\s\S]*?)```/i);
  if (blockMatch && blockMatch[1]) {
    return blockMatch[1].trim();
  }
  return code.replace(/^```[a-z]*\n?/gi, "").replace(/\n?```\s*$/gi, "").trim();
}

export async function writeComposition(code: string): Promise<boolean> {
  try {
    if (!code || !window.electronAPI?.writeFile) return false;
    await window.electronAPI.writeFile(COMPOSITION_PATH, code);
    return true;
  } catch (err) {
    console.error("[compositionStore] Failed to write composition:", err);
    return false;
  }
}

export async function readComposition(): Promise<string> {
  try {
    if (!window.electronAPI?.readFile) return "";
    return (await window.electronAPI.readFile(COMPOSITION_PATH)) || "";
  } catch (err) {
    console.error("[compositionStore] Failed to read composition:", err);
    return "";
  }
}
