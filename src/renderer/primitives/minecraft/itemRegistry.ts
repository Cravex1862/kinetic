// Index all 790+ authentic Minecraft item PNG textures using Vite eager glob import
const itemModules = (import.meta as any).glob('./item/*.png', { eager: true, import: 'default' });

const ITEM_TEXTURES: Record<string, string> = {};

for (const path in itemModules) {
  const itemId = path.split('/').pop()?.replace('.png', '') || '';
  if (itemId) {
    ITEM_TEXTURES[itemId] = itemModules[path];
  }
}

/**
 * Get authentic Minecraft item PNG texture URL by item ID string
 * e.g. getItemTexture('diamond_sword'), getItemTexture('golden_apple')
 */
export function getItemTexture(itemId: string): string {
  if (!itemId) return '';
  const cleanId = itemId.toLowerCase().trim().replace(/[-\s]+/g, '_');
  return ITEM_TEXTURES[cleanId] || ITEM_TEXTURES['barrier'] || '';
}

export const ALL_MINECRAFT_ITEM_IDS = Object.keys(ITEM_TEXTURES);
