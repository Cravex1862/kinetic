import { pipeline, env } from "@xenova/transformers";
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

env.allowLocalModels = true;
env.localModelPath = 'public/models';

// Set to false to enable skill RAG vector matching
export const DISABLE_SKILL_INJECTION = false;

let extractorPipeline: any = null;

function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    for (let i = 0; i < 768; i++) {
        dotProduct += a[i] * b[i];
    }
    return dotProduct;
}

async function getExtractor() {
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
    // Case-insensitive match for Deliver / Verification section heading and all contents up to next heading or end
    return content.replace(/(#+\s*)?(Deliver|Verification|Verify)[\s\S]*?(?=(\n#+\s+|$))/gi, '').trim();
}

/**
 * Finds top K relevant skills for a prompt using 100% Pure Vector Cosine Similarity.
 * Optionally filters by skill category ('motion' | 'data' | 'layout' | 'meta').
 */
export async function findRelevantSkills(
    prompt: string,
    topK: number = 2,
    categoryFilter?: SkillCategory
): Promise<RelevantSkill[]> {
    if (DISABLE_SKILL_INJECTION) {
        return [];
    }

    try {
        const extractor = await getExtractor();
        let skills = skillsData as SkillEntry[];

        // Optional category filter (e.g. only 'motion' or 'layout')
        if (categoryFilter) {
            skills = skills.filter((s) => s.category === categoryFilter);
        }

        const queryOutput = await extractor(prompt, { pooling: 'mean', normalize: true });
        const queryVector = Array.from(queryOutput.data) as number[];

        const scored = skills.map((skill) => {
            const simScore = cosineSimilarity(queryVector, skill.embedding);

            return {
                name: skill.name,
                description: skill.description,
                category: skill.category,
                cleanContent: stripDeliverAndVerify(skill.cleanContent),
                score: simScore,
            };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    } catch (error) {
        console.error("Error in 100% Vector Rag retrieval:", error);
        return [];
    }
}

export function getAllSkillNames(): string[] {
    if (DISABLE_SKILL_INJECTION) {
        return [];
    }
    const skills = skillsData as SkillEntry[];
    return skills.map(s => s.name);
}

export function getSkillByName(name: string): RelevantSkill | null {
    if (DISABLE_SKILL_INJECTION) {
        return null;
    }
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