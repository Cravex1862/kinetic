import { getStoredConfig } from '../../agents/llmClient';
import { runManager } from '../../agents/managerAgent';
import { runLayoutAgent } from '../../agents/layoutAgent';
import { runAnimationAgent } from '../../agents/animationAgent';
import { runCopywritingAgent } from '../../agents/copywritingAgent';
import { compileAllScenes } from '../../agents/sceneCompiler';
import type { SceneOutput, PipelineState, ComponentTree, AnimationPlan } from '../../agents/types';


export type PipelineCallback = (state: PipelineState) => void;

export async function runPipeline(
    prompt: string,
    narration: string,
    onState: PipelineCallback,
): Promise<SceneOutput[]> {
    const config = getStoredConfig();
    if (!config) {
        onState({ status: 'error', progress: 0, error: 'No API key configured. Set one in the setup dialog.' });
        return [];
    }

    // Step 1: Manager → Storyboard
    onState({ status: 'storyboarding', progress: 0.1 });
    const storyResult = await runManager(config, prompt, narration);
    if (!storyResult.storyboard || storyResult.error) {
        onState({ status: 'error', progress: 0.1, error: storyResult.error || 'Storyboarding failed' });
        return [];
    }
    const { scenes } = storyResult.storyboard;
    const total = scenes.length;

    const componentTrees: ComponentTree[] = [];
    const animationPlans: AnimationPlan[] = [];
    const copies: Array<{ captions: string[]; labels: string[]; voiceover: string }> = [];

    const delay = (ms:number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = 0; i < total; i++) {
        const scene = scenes[i];
        const progressBase = 0.1 + (i / total) * 0.85;

        // Step 2: Layout Agent
        onState({ status: 'laying-out', progress: progressBase });
        const layoutResult = await runLayoutAgent(config, scene, componentTrees[i - 1]);
        if (!layoutResult.components || layoutResult.error) {
            onState({ status: 'error', progress: progressBase, error: layoutResult.error || `Layout failed for ${scene.id}` });
            return [];
        }
        componentTrees.push(layoutResult.components);

        // Step 3: Animation Agent
        onState({ status: 'animating', progress: progressBase + 0.3 / total });
        const animResult = await runAnimationAgent(config, scene, layoutResult.components);
        if (!animResult.animation || animResult.error) {
            onState({ status: 'error', progress: progressBase + 0.3 / total, error: animResult.error || `Animation failed for ${scene.id}` });
            return [];
        }
        animationPlans.push(animResult.animation);

        // Step 4: Copywriting Agent
        onState({ status: 'copywriting', progress: progressBase + 0.6 / total });
        const copyResult = await runCopywritingAgent(config, scene);
        if (!copyResult.copy || copyResult.error) {
            copies.push({ captions: [], labels: [], voiceover: scene.narration });
        } else {
            copies.push(copyResult.copy);
        }
        try{
            const partialScenes = compileAllScenes(
                scenes.slice(0, i+1),
                componentTrees,
                animationPlans,
                copies
            );
        localStorage.setItem('kinetic-unfinished-project', JSON.stringify({
            title: 'Unfinished Project',
            prompt,
            narration,
            scenes: partialScenes,
            status: 'unfinished'
        }));
        }
        catch(e){
            console.error("Failed to save checkpoint:", e)
        }
    }

    // Step 5: Compile
    onState({ status: 'compiling', progress: 0.98 });
    const output = compileAllScenes(scenes, componentTrees, animationPlans, copies);

    onState({ status: 'done', progress: 1, output });
    return output;
}
