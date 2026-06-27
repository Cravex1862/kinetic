/**
 * Kinetic Central Design System Tokens
 * Defines core colors, borders, and transitions for the Obsidian & Purple theme.
 */
export const THEME = {
  colors: {
    background: '#030712',      // Deep Obsidian Black
    card: '#18181b',            // Zinc-900 Card Base
    cardHover: '#27272a',       // Zinc-800 Card Base on Hover
    border: '#27272a',          // Dark zinc border
    borderFocus: '#8b5cf6',     // Slate purple focus border
    textPrimary: '#f9fafb',     // Bright white text
    textSecondary: '#9ca3af',   // Slate gray muted text
    accent: '#8b5cf6',          // Main Purple Accent
    accentHover: '#a78bfa',     // Hover Purple Accent
    shadowGlow: 'rgba(139, 92, 246, 0.15)', // Subtle Purple Glow
  },
  borderRadius: {
    card: '0.75rem',            // rounded-xl
    input: '0.375rem',          // rounded-md
    button: '0.5rem',           // rounded-lg
  },
  transitions: {
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  }
};
