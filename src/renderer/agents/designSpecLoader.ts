import { AgentConfig } from './types';

export interface SiteDesignSpec {
    siteKey: string;
    name: string;
    description: string;
    colors: {
        primary: string;
        canvas: string;
        surface1: string;
        surface2: string;
        border: string;
        textPrimary: string;
        textMuted: string;
    };
}

// Full directory of 75 awesome-design-md + custom site keys
export const AVAILABLE_DESIGN_SPEC_KEYS = [
    'airbnb', 'airtable', 'apple', 'binance', 'bmw', 'bmw-m', 'bugatti', 'cal',
    'claude', 'clay', 'clickhouse', 'cohere', 'coinbase', 'composio', 'cursor',
    'dell-1996', 'elevenlabs', 'expo', 'ferrari', 'figma', 'framer', 'github', 'hashicorp',
    'hp', 'ibm', 'intercom', 'kraken', 'lamborghini', 'linear.app', 'lovable',
    'mastercard', 'meta', 'minimax', 'mintlify', 'miro', 'mistral.ai', 'mongodb',
    'nike', 'nintendo-2001', 'notion', 'nvidia', 'ollama', 'opencode.ai',
    'pinterest', 'playstation', 'posthog', 'raycast', 'renault', 'replicate',
    'resend', 'revolut', 'runwayml', 'sanity', 'sentry', 'shopify', 'slack',
    'spacex', 'spotify', 'starbucks', 'stripe', 'supabase', 'superhuman', 'tesla',
    'theverge', 'together.ai', 'uber', 'vercel', 'vodafone', 'voltagent', 'warp',
    'webflow', 'wired', 'wise', 'x.ai', 'zapier'
];

export function getAvailableSitesSummary(): string {
    return AVAILABLE_DESIGN_SPEC_KEYS.join(', ');
}

export function detectSiteKeyFromPrompt(prompt: string): string | undefined {
    if (!prompt) return undefined;
    const lowerPrompt = prompt.toLowerCase();

    for (const key of AVAILABLE_DESIGN_SPEC_KEYS) {
        if (lowerPrompt.includes(key)) return key;
        const cleanBase = key.replace(/\.(app|ai|com|io|co|net)$/i, '');
        if (cleanBase.length > 2 && new RegExp(`\\b${cleanBase}\\b`, 'i').test(lowerPrompt)) {
            return key;
        }
    }
    return undefined;
}

// Parse YAML frontmatter block from DESIGN.md file content
export function parseDesignMdYaml(content: string, siteKey: string): SiteDesignSpec {
    const defaultSpec: SiteDesignSpec = {
        siteKey,
        name: siteKey,
        description: `Official design tokens for ${siteKey}`,
        colors: {
            primary: '#6366f1',
            canvas: '#09090b',
            surface1: '#18181b',
            surface2: '#27272a',
            border: '#3f3f46',
            textPrimary: '#f4f4f5',
            textMuted: '#a1a1aa',
        },
    };

    if (!content) return defaultSpec;

    try {
        // Extract frontmatter between --- and ---
        const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!match) return defaultSpec;

        const yamlText = match[1];

        // Simple Regex Extraction for colors
        const extractColor = (key: string, fallback: string): string => {
            const m = yamlText.match(new RegExp(`${key}:\\s*["']?([^"'\n\\s]+)["']?`, 'i'));
            return m ? m[1] : fallback;
        };

        const extractField = (key: string, fallback: string): string => {
            const m = yamlText.match(new RegExp(`${key}:\\s*["']?([^"'\n]+)["']?`, 'i'));
            return m ? m[1].trim() : fallback;
        };

        return {
            siteKey,
            name: extractField('name', siteKey),
            description: extractField('description', `Design specs for ${siteKey}`),
            colors: {
                primary: extractColor('primary', '#6366f1'),
                canvas: extractColor('canvas', '#09090b'),
                surface1: extractColor('surface-1', '#18181b'),
                surface2: extractColor('surface-2', '#27272a'),
                border: extractColor('hairline', '#3f3f46'),
                textPrimary: extractColor('ink', '#f4f4f5'),
                textMuted: extractColor('ink-muted', '#a1a1aa'),
            },
        };
    } catch {
        return defaultSpec;
    }
}

// Load DESIGN.md on-demand for target site key
export async function loadDesignSpec(siteKey: string): Promise<SiteDesignSpec> {
    const cleanKey = siteKey.toLowerCase().trim();

    // Find matching directory key from 75 site list
    const matchedKey = AVAILABLE_DESIGN_SPEC_KEYS.find(k =>
        k === cleanKey || k.replace(/\.(app|ai|com|io|co|net)$/i, '') === cleanKey
    ) || cleanKey;

    if (matchedKey === 'github') {
        const ghPath = `src/renderer/design-specs/github/github.md`;
        const ghDefault: SiteDesignSpec = {
            siteKey: 'github',
            name: 'GitHub Primer',
            description: 'Official GitHub Primer visual design tokens',
            colors: {
                primary: '#238636',
                canvas: '#0d1117',
                surface1: '#161b22',
                surface2: '#21262d',
                border: '#30363d',
                textPrimary: '#c9d1d9',
                textMuted: '#8b949e',
            },
        };
        try {
            if (window.electronAPI?.readFile) {
                const content = await window.electronAPI.readFile(ghPath);
                return parseDesignMdYaml(content, 'github');
            }
        } catch {
            // fallback
        }
        return ghDefault;
    }

    const relativePath = `src/renderer/design-specs/awesome-design-md/design-md/${matchedKey}/DESIGN.md`;

    try {
        if (window.electronAPI?.readFile) {
            const content = await window.electronAPI.readFile(relativePath);
            return parseDesignMdYaml(content, matchedKey);
        } else {
            const res = await fetch(`/@fs/${relativePath}`).catch(() => null);
            if (res && res.ok) {
                const content = await res.text();
                return parseDesignMdYaml(content, matchedKey);
            }
        }
    } catch (e) {
        console.warn(`[DesignSpecLoader] Could not load DESIGN.md for ${matchedKey}`, e);
    }

    return parseDesignMdYaml('', matchedKey);
}

