// Index all authentic Minecraft GUI PNG textures using Vite eager glob import
const guiModules = (import.meta as any).glob('./gui/**/*.png', { eager: true, import: 'default' });

const GUI_TEXTURES: Record<string, string> = {};

for (const path in guiModules) {
  const key = path.replace(/^\.\/gui\//, '').replace(/\.png$/, '');
  GUI_TEXTURES[key] = guiModules[path];
}

/**
 * Get authentic Minecraft GUI texture URL by key
 * e.g. getGuiTexture('container/inventory')
 */
export function getGuiTexture(key: string): string {
  return GUI_TEXTURES[key] || '';
}

export const ALL_GUI_KEYS = Object.keys(GUI_TEXTURES);
