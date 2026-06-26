import { getStoredConfig } from '../../agents/llmClient';
import { runManager } from '../../agents/managerAgent';
import { runLayoutAgent } from '../../agents/layoutAgent';
import { runAnimationAgent } from '../../agents/animationAgent';
import { runCopywritingAgent } from '../../agents/copywritingAgent';
import { compileAllScenes } from '../../agents/sceneCompiler';
import type { SceneOutput, PipelineState, ComponentTree, AnimationPlan } from '../../agents/types';


export type PipelineCallback = (state: PipelineState) => void;

export interface ResumeState {
    scenes: any[];
    componentTrees: ComponentTree[];
    animationPlans: AnimationPlan[];
    copies: Array<{ captions: string[]; labels: string[]; voiceover: string }>;
}


export async function runPipeline(
    prompt: string,
    narration: string,
    onState: PipelineCallback,
    savePath?: string,
    resumeState?: ResumeState,
    onCheckpoint?: (checkpoint: any) => void,
    projectTitle?: string
): Promise<SceneOutput[]> {
    const config = getStoredConfig();
    if (!config) {
        onState({ status: 'error', progress: 0, error: 'No API key configured. Set one in the setup dialog.' });
        return [];
    }

    // Save initial checkpoint marking it as unfinished
    try {
        const initialData = {
            title: projectTitle || 'Untitled',
            prompt,
            narration,
            scenes: resumeState?.scenes || [],
            unfinished: true,
            generationState: resumeState ? {
                scenes: resumeState.scenes,
                componentTrees: resumeState.componentTrees,
                animationPlans: resumeState.animationPlans,
                copies: resumeState.copies,
            } : undefined,
            savePath
        };
        if (savePath && window.electronAPI?.writeFile) {
            window.electronAPI.writeFile(savePath, JSON.stringify(initialData, null, 2));
        }
        if (onCheckpoint) {
            onCheckpoint(initialData);
        }
    } catch (e) {
        console.error("Failed to save initial unfinished state:", e);
    }

    let scenes: any[] = [];

    if (resumeState) {
        scenes = resumeState.scenes;
    } else {
        onState({ status: 'storyboarding', progress: 0.1 });
        const storyResult = await runManager(config, prompt, narration);
        if (!storyResult.storyboard || storyResult.error) {
            onState({ status: 'error', progress: 0.1, error: storyResult.error || 'Storyboarding failed' });
            return [];
        }
        scenes = storyResult.storyboard.scenes;
    }


    const total = scenes.length;

    const componentTrees: ComponentTree[] = resumeState ? [...resumeState.componentTrees] : [];
    const animationPlans: AnimationPlan[] = resumeState ? [...resumeState.animationPlans] : [];
    const copies: Array<{ captions: string[]; labels: string[]; voiceover: string }> = resumeState ? [...resumeState.copies] : [];

    const startIndex = componentTrees.length;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (let i = startIndex; i < total; i++) {
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
        try {
            const partialScenes = compileAllScenes(
                scenes.slice(0, i + 1),
                componentTrees,
                animationPlans,
                copies
            );
            const checkpointData = {
                title: projectTitle || 'Untitled',
                prompt,
                narration,
                scenes: partialScenes,
                unfinished: true,
                generationState: {
                    scenes,
                    componentTrees,
                    animationPlans,
                    copies,
                },
                savePath
            };
            if (savePath && window.electronAPI?.writeFile) {
                window.electronAPI.writeFile(savePath, JSON.stringify(checkpointData, null, 2));
            }
            if (onCheckpoint) {
                onCheckpoint(checkpointData);
            }
        }
        catch (e) {
            console.error("Failed to save checkpoint:", e)
        }
    }

    // Step 5: Compile
    onState({ status: 'compiling', progress: 0.98 });
    const output = compileAllScenes(scenes, componentTrees, animationPlans, copies);

    const finishedData = {
        title: projectTitle || 'Untitled',
        prompt,
        narration,
        scenes: output,
        unfinished: false,
        savePath
    };

    try {
        if (savePath && window.electronAPI?.writeFile) {
            window.electronAPI.writeFile(savePath, JSON.stringify(finishedData, null, 2));
        }
    } catch (e) {
        console.error("Failed to save finished project file:", e);
    }
    if (onCheckpoint) {
        onCheckpoint(finishedData);
    }

    onState({ status: 'done', progress: 1, output });
    return output;
}
