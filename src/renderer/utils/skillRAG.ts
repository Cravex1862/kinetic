import skillsData from '../../../skills/skills-index.json';

export type SkillCategory = 'motion' | 'data' | 'layout' | 'meta';

export interface SkillEntry {
    id: string;
    name: string;
    description: string;
    category: SkillCategory;
    relativePath: string;
    cleanContent: string;
    keywords: string[];
    embedding: number[];
}

export interface RelevantSkill {
    name: string;
    description: string;
    category: SkillCategory;
    cleanContent: string;
    score: number;
}

export const ENABLE_VECTOR_MATCHING = true;

function tokenize(text: string): string[] {
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/).filter(Boolean);
}

function keywordScore(query: string, keywords: string[]): number {
    const queryTokens = tokenize(query);
    const keywordSet = new Set(keywords.map((k) => k.toLowerCase()));
    let matches = 0;
    for (const token of queryTokens) {
        if (keywordSet.has(token)) matches++;
    }
    return queryTokens.length > 0 ? matches / queryTokens.length : 0;
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < 768; i++) {
        dotProduct += a[i] * b[i];
    }
    return dotProduct;
}

let extractorPipeline: unknown = null;

async function getExtractor(): Promise<unknown> {
    const { pipeline } = await import('@xenova/transformers');
    if (!extractorPipeline) {
        extractorPipeline = await pipeline('feature-extraction', 'Xenova/all-mpnet-base-v2', {
            quantized: true,
            cache_dir: 'public/models',
        });
    }
    return extractorPipeline;
}

/**
 * Strips out non-useful "Deliver & verify" terminal bash command sections from skill markdown.
 */
export function stripDeliverAndVerify(content: string): string {
    if (!content) return '';
    return content.replace(/(#+\s*)?(Deliver|Verification|Verify)[\s\S]*?(?=(\n#+\s+|$))/gi, '').trim();
}

/**
 * Finds top K relevant skills for a prompt using keyword scoring (default)
 * or vector cosine similarity (opt-in via ENABLE_VECTOR_MATCHING).
 */
export async function findRelevantSkills(
    prompt: string,
    topK: number = 2,
    categoryFilter?: SkillCategory
): Promise<RelevantSkill[]> {
    let skills = skillsData as SkillEntry[];

    if (categoryFilter) {
        skills = skills.filter((s) => s.category === categoryFilter);
    }

    if (!ENABLE_VECTOR_MATCHING) {
        const scored = skills.map((skill) => ({
            name: skill.name,
            description: skill.description,
            category: skill.category,
            cleanContent: stripDeliverAndVerify(skill.cleanContent),
            score: keywordScore(prompt, skill.keywords),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    try {
        const extractor = await getExtractor() as {
            (input: string, options: Record<string, unknown>): Promise<{ data: Float32Array }>;
        };
        const queryOutput = await extractor(prompt, { pooling: 'mean', normalize: true });
        const queryVector = Array.from(queryOutput.data) as number[];

        const scored = skills.map((skill) => ({
            name: skill.name,
            description: skill.description,
            category: skill.category,
            cleanContent: stripDeliverAndVerify(skill.cleanContent),
            score: cosineSimilarity(queryVector, skill.embedding),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    } catch (error) {
        console.warn("[skillRAG] Vector matching failed, falling back to keyword scoring:", error);
        const scored = skills.map((skill) => ({
            name: skill.name,
            description: skill.description,
            category: skill.category,
            cleanContent: stripDeliverAndVerify(skill.cleanContent),
            score: keywordScore(prompt, skill.keywords),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
}

export function getAllSkillNames(): string[] {
    const skills = skillsData as SkillEntry[];
    return skills.map(s => s.name);
}

export function getSkillByName(name: string): RelevantSkill | null {
    const skills = skillsData as SkillEntry[];
    const match = skills.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!match) return null;
    return {
        name: match.name,
        description: match.description,
        category: match.category,
        cleanContent: stripDeliverAndVerify(match.cleanContent),
        score: 1.0,
    };
}
