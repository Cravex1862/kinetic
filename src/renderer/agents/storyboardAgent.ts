import { callLLM, safeParseJson } from "./llmClient";
import type { AgentConfig, StoryboardScene } from "./types";
import { PRIMITIVE_MENU_SUMMARY } from "./primitiveRegistry";

export interface StoryboardSceneDef {
    id: string;
    description: string;
    duration: number;
    narration: string;
    requestedPrimitives: string[];
    layoutConcept: string;
}

export interface StoryboardOutput {
    scenes: StoryboardSceneDef[];
}

export async function runStoryboardAgent(
    config: AgentConfig,
    prompt: string,
    narration: string
): Promise<{ storyboard?: StoryboardOutput; error?: string }> {
    const systemPrompt = `
    
    You are an expert Remotion Video Storyboard Agent.
    Your job is to break motion graphics (mainly UI based) requests into sequential scene storyboards.
    Primitives are the sample code recreated configurable UI blocks that you are meant to use but keep in mind that it is NOT compulsory to use them if you think a custom component is better fit in the requested animation mention you want to use that instead. Listed below are all availble primitives:
    
    ${PRIMITIVE_MENU_SUMMARY}

    OUTPUT FORMAT: Return strict JSON only matching this interface:
    {
        "scenes": [
            {
            "id": "scene_1",
            "description": "High-level visual summary of the scene",
            "duration": 150,
            "narration": "Voiceover narration script for this scene",
            "requestedPrimitives": ["BrowserFrame", "GlassmorphicCard", "LineChartCard"],
            "layoutConcept": "Ambient dark canvas with a central glassmorphics window titlting upward in 3D"
            }
        ]
    }
    `;

    const userPrompt = `
    UserPrompt: ${prompt}
    NarrationScript: ${narration}

    Generate how many ever scenes you see fit selecting primitves from the menu. For example a basic animation of a button being pressed requires ONLY one scene. But a complex scene of multiple points lets say in an explainer motion graphic. Where there is [1], [2], [3] boxes on screen and each one goes up to unveil another point and like animation to help explain the topic requires 3 scenes.

    `;

    const response = await callLLM(config, systemPrompt, userPrompt);
    if (response.error) return { error: response.error };

    const parsed = safeParseJson<StoryboardOutput>(response.content, { scenes: [] });

    if (!parsed.scenes || parsed.scenes.length === 0) {
        return { error: `Storyboard agent returned no scenes.` };
    }

    // Normalize requestedPrimitives for each scene
    parsed.scenes = parsed.scenes.map((s: any) => ({
        ...s,
        requestedPrimitives: s.requestedPrimitives || s.requestedPrmitives || [],
    }));

    return { storyboard: parsed };
}

