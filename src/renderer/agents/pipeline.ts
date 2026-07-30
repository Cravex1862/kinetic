import { getStoredConfig } from "./llmClient";
import { runStoryboardAgent } from "./storyboardAgent";
import { ingestPrimitiveSourceCode } from "./primitiveRegistry";
import { runCodeGeneratorAgent } from "./codeGeneratorAgent";
import { runCodeAnimatorAgent } from "./codeAnimatorAgent";
import { runCodeVerifierAgent } from "./codeVerifierAgent";
import { runAnimationVerifierAgent } from "./animationVerifierAgent";
import { PipelineState } from "./types";

export type PipeCallback = (state: PipelineState) => void;
export type PipelineCallback = PipeCallback;

export interface ResumeState {
    scenes: any[];
    sceneCodeBlocks?: string[];
}

export function stripAllImports(code: string): string {
    if (!code) return '';
    let cleaned = code
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/```/g, '')
        .replace(/import\s+type\s+[\s\S]*?from\s+['"][^'"]+['"];?/gi, '')
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gi, '')
        .replace(/import\s+['"][^'"]+['"];?/gi, '')
        .replace(/^[^{}\n]*\}\s*from\s*['"][^'"]+['"];?[^\n]*/gm, '')
        .replace(/.*from\s*['"]remotion['"];?[^\n]*/gi, '')
        .replace(/.*from\s*['"]\.\.\/primitives[^'"]*['"];?[^\n]*/gi, '');

    const lines = cleaned.split('\n');
    const filteredLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) continue;
        if (trimmed.includes('from "remotion"') || trimmed.includes("from 'remotion'")) continue;
        if (trimmed.includes('from "../primitives') || trimmed.includes("from '../primitives")) continue;
        if (/^\}?\s*from\s*['"][^'"]+['"];?/.test(trimmed)) continue;
        if (/^(?:useCurrentFrame|useVideoConfig|spring|interpolate|Sequence|Series)\s*,?\s*(\/\/.*)?$/.test(trimmed)) continue;
        if (/^(?:Series|Sequence)\s*,?\s*(\/\/.*)?$/.test(trimmed)) continue;
        filteredLines.push(line);
    }

    return filteredLines.join('\n').trim();
}

export function sanitizeCompositionCode(code: string): string {
    if (!code) return '';
    let bodyWithoutImports = stripAllImports(code);
    if (!bodyWithoutImports || bodyWithoutImports.trim().length === 0) return '';

    // Convert comment JSX {/* Scene X */} to <SceneX />
    bodyWithoutImports = bodyWithoutImports.replace(/\{\/\*\s*Scene\s+(\d+)\s*\*\/\}/gi, '<Scene$1 />');

    return `import React from 'react';
import { Series, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Easing, AbsoluteFill, Img, staticFile } from 'remotion';

import type { GlowConfig, StyleConfig } from '../primitives/types';
import { 
    ActionButton, AppCanvas, BreadcrumbHeader, BrowserFrame, DataGridContainer, 
    HeroMetricCard, MockWindow, NotificationToaster, SidebarLayout, SplitHeroLayout, 
    TabSwitcherContainer, TopNavbar 
} from '../primitives/StructuralSDK';
import { 
    BillingInvoiceCard, CustomCard, FeatureBenefitCard, FeatureCard, GlassmorphicCard, 
    KanbanTaskCard, NotificationCard, PriceCard, PricingPlanCard, ProfileCard, 
    ProfileHeaderCard, PushNotificationToast, RegularCard, SettingsToggleCard 
} from '../primitives/CardSDK';
import { 
    AreaChart, BarChartCard, DonutChartCard, LineChartCard, MetricFunnel, 
    PieChartCard, ScatterPlotCard, StockCard 
} from '../primitives/ChartsSDK';
import { 
    SpringEnter, StaggerContainer, FadeBlur, SlideInOut, CardReveal, PulseScale, 
    AccordionExpand, RotateFlip, GlitchIntro 
} from '../primitives/TransitionSDK';
import { 
    Cursor, SmoothScroll, FocusZoom, TextTyper, ChartAnimate, DragAndDrop, 
    TypingGhostCursor, MarqueeTrack, ProgressRing 
} from '../primitives/MotionSDK';

${bodyWithoutImports}
`;
}

export function sanitizeAndAssembleComposition(sceneCodeBlocks: string[], scenes: any[]): string {
    const cleanedBlocks = sceneCodeBlocks.map(block => stripAllImports(block));

    return `import React from 'react';
import { Series, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import type { GlowConfig, StyleConfig } from '../primitives/types';
import { 
    ActionButton, AppCanvas, BreadcrumbHeader, BrowserFrame, DataGridContainer, 
    HeroMetricCard, MockWindow, NotificationToaster, SidebarLayout, SplitHeroLayout, 
    TabSwitcherContainer, TopNavbar 
} from '../primitives/StructuralSDK';
import { 
    BillingInvoiceCard, CustomCard, FeatureBenefitCard, FeatureCard, GlassmorphicCard, 
    KanbanTaskCard, NotificationCard, PriceCard, PricingPlanCard, ProfileCard, 
    ProfileHeaderCard, PushNotificationToast, RegularCard, SettingsToggleCard 
} from '../primitives/CardSDK';
import { 
    AreaChart, BarChartCard, DonutChartCard, LineChartCard, MetricFunnel, 
    PieChartCard, ScatterPlotCard, StockCard 
} from '../primitives/ChartsSDK';
import { 
    SpringEnter, StaggerContainer, FadeBlur, SlideInOut, CardReveal, PulseScale, 
    AccordionExpand, RotateFlip, GlitchIntro 
} from '../primitives/TransitionSDK';
import { 
    Cursor, SmoothScroll, FocusZoom, TextTyper, ChartAnimate, DragAndDrop, 
    TypingGhostCursor, MarqueeTrack, ProgressRing 
} from '../primitives/MotionSDK';

${cleanedBlocks.join('\n\n')}

export const VideoComposition: React.FC = () => {
    return (
        <div className="w-full h-full bg-slate-950 text-white relative overflow-hidden flex items-center justify-center">
            <Series>
                ${scenes.slice(0, cleanedBlocks.length).map((s, idx) => `
                <Series.Sequence durationInFrames={${s.duration || 150}}>
                    <Scene${idx + 1} />
                </Series.Sequence>
                `).join('')}
            </Series>
        </div>
    );
};

export default VideoComposition;
`;
}

export async function runTSXPipeline(
    prompt: string,
    narration: string,
    onState: PipeCallback,
    savePath?: string,
    resumeState?: ResumeState,
    onCheckpoint?: (checkpoint: any) => void,
    projectTitle?: string
): Promise<string> {
    const config = getStoredConfig();
    if (!config) {
        onState({ status: 'error', progress: 0, error: "No API key configured. Set one in setup." });
        return '';
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
                sceneCodeBlocks: resumeState.sceneCodeBlocks || [],
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

    // Stage 1: Storyboard Agent or Resume
    if (resumeState?.scenes && resumeState.scenes.length > 0) {
        scenes = resumeState.scenes;
    } else {
        onState({ status: 'storyboarding', progress: 0.1 });
        const storyRes = await runStoryboardAgent(config, prompt, narration);
        if (storyRes.error || !storyRes.storyboard) {
            onState({ status: 'error', progress: 0.1, error: storyRes.error || 'Storyboarding failed' });
            return '';
        }
        scenes = storyRes.storyboard.scenes;
    }

    const sceneCodeBlocks: string[] = resumeState?.sceneCodeBlocks ? [...resumeState.sceneCodeBlocks] : [];
    const startIndex = sceneCodeBlocks.length;

    // Stage 2 -> 6 per scene
    for (let i = startIndex; i < scenes.length; i++) {
        const scene = scenes[i];
        const progressBase = 0.15 + (i / scenes.length) * 0.75;
        const sceneNum = i + 1;

        // Stage 2: Primitive Ingestion
        onState({ status: 'laying-out', progress: progressBase });
        const requested = scene.requestedPrimitives || (scene as any).requestedPrmitives || [];
        const ingestedCode = await ingestPrimitiveSourceCode(requested);

        // Stage 3: Visual Code Generator
        onState({ status: 'designing', progress: progressBase + 0.1 });
        const genRes = await runCodeGeneratorAgent(config, scene, ingestedCode, sceneNum);
        if (genRes.error || !genRes.tsxCode) {
            onState({ status: 'error', progress: progressBase + 0.1, error: genRes.error });
            return '';
        }

        // Stage 4: Dedicated Animator
        onState({ status: 'animating', progress: progressBase + 0.2 });
        const animRes = await runCodeAnimatorAgent(config, scene, genRes.tsxCode, sceneNum);
        if (animRes.error || !animRes.animatedTsxCode) {
            onState({ status: 'error', progress: progressBase + 0.2, error: animRes.error });
            return '';
        }

        // Stage 5: Syntax Verifier
        onState({ status: 'compiling', progress: progressBase + 0.25 });
        const v1 = await runCodeVerifierAgent(config, animRes.animatedTsxCode, sceneNum, 1);

        // Stage 6: Motion Verifier
        const v2 = await runAnimationVerifierAgent(config, v1.verifiedTsxCode, sceneNum, 1);

        sceneCodeBlocks.push(v2.finalTsxCode);

        // Per-scene Checkpoint Save
        try {
            const partialCompositionCode = sanitizeAndAssembleComposition(sceneCodeBlocks, scenes);

            if (window.electronAPI?.writeFile) {
                await window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', partialCompositionCode);
            }

            const checkpointData = {
                title: projectTitle || 'Untitled',
                prompt,
                narration,
                scenes,
                code: partialCompositionCode,
                unfinished: true,
                generationState: {
                    scenes,
                    sceneCodeBlocks,
                },
                savePath
            };

            if (savePath && window.electronAPI?.writeFile) {
                await window.electronAPI.writeFile(savePath, JSON.stringify(checkpointData, null, 2));
            }
            if (onCheckpoint) {
                onCheckpoint(checkpointData);
            }
        } catch (e) {
            console.error("Failed to save checkpoint for scene:", i, e);
        }
    }

    // Assembly & Final Save
    onState({ status: 'compiling', progress: 0.95 });
    const finalCompositionCode = sanitizeAndAssembleComposition(sceneCodeBlocks, scenes);

    const finishedData = {
        title: projectTitle || 'Untitled',
        prompt,
        narration,
        scenes,
        code: finalCompositionCode,
        unfinished: false,
        savePath
    };

    if (window.electronAPI?.writeFile) {
        try {
            await window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', finalCompositionCode);
            if (savePath) {
                await window.electronAPI.writeFile(savePath, JSON.stringify(finishedData, null, 2));
            }
        } catch (e) {
            console.error("Failed to write final composition file:", e);
        }
    }

    if (onCheckpoint) {
        onCheckpoint(finishedData);
    }

    onState({ status: 'done', progress: 1.0 });
    return finalCompositionCode;
}

export const runPipeline = runTSXPipeline;
