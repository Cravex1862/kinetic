import { getStoredConfig, callLLM } from "./llmClient";
import { runStoryboardAgent, StoryboardSceneDef } from "./storyboardAgent";
import { ingestPrimitiveSourceCode, PRIMITIVE_MENU_SUMMARY } from "./primitiveRegistry";
import { runCodeGeneratorAgent } from "./codeGeneratorAgent";
import { runCodeAnimatorAgent } from "./codeAnimatorAgent";
import { runCodeVerifierAgent } from "./codeVerifierAgent";
import { runAnimationVerifierAgent } from "./animationVerifierAgent";
import { PipelineState, AgentConfig } from "./types";
import { parseTimestampedScript } from "../utils/timestampScriptParser";
import { loadDesignSpec, detectSiteKeyFromPrompt } from "./designSpecLoader";

export interface ComponentPlan {
    id: string;
    primitiveName: string;
    sdkCategory: string;
    purpose: string;
    startFrame: number;
    durationInFrames: number;
}

export interface ShotDesignPlan {
    sceneNum: number;
    totalDuration: number;
    colorTheme: { background: string; primaryAccent: string; cardBg: string };
    components: ComponentPlan[];
}

export async function runDesignAgent(
    config: AgentConfig,
    scene: StoryboardSceneDef,
    sceneNum: number,
    targetSiteKey?: string
): Promise<ShotDesignPlan> {
    const detectedKey = targetSiteKey || detectSiteKeyFromPrompt(`${scene.description} ${scene.layoutConcept}`);
    let specPromptInfo = '';
    let defaultTheme = { background: '#030712', primaryAccent: '#10B981', cardBg: '#0F172A' };

    if (detectedKey) {
        const spec = await loadDesignSpec(detectedKey);
        if (spec) {
            defaultTheme = {
                background: spec.colors.canvas,
                primaryAccent: spec.colors.primary,
                cardBg: spec.colors.surface1,
            };
            specPromptInfo = `
        Site Brand Design Tokens (${spec.siteKey}):
        - Primary Accent: ${spec.colors.primary}
        - Canvas Background: ${spec.colors.canvas}
        - Surface 1 / Card Background: ${spec.colors.surface1}
        - Surface 2: ${spec.colors.surface2}
        - Hairline Border: ${spec.colors.border}
        - Text Primary: ${spec.colors.textPrimary}
        - Text Muted: ${spec.colors.textMuted}
        Please apply these exact brand color tokens in your colorTheme.`;
        }
    }

    const designPrompt = `
        You are the Lead Motion Design Agent. Create a shot design blueprint for Scene ${sceneNum}.
        Scene Description: "${scene.description}"
        Layout Concept: "${scene.layoutConcept}"
        ${specPromptInfo}

        Available Primitives: ${PRIMITIVE_MENU_SUMMARY.slice(0, 1500)}

        Return Strict JSON matching:
        {
            "sceneNum": ${sceneNum},
            "totalDuration": 150,
            "colorTheme": { "background": "${defaultTheme.background}", "primaryAccent": "${defaultTheme.primaryAccent}", "cardBg": "${defaultTheme.cardBg}" },
            "components": [
                { "id": "browser-1", "primitiveName": "BrowserFrame", "sdkCategory": "StructuralSDK", "purpose": "Container", "startFrame": 0, "durationInFrames": 150 },
                { "id": "chart-1", "primitiveName": "BarChartCard", "sdkCategory": "ChartsSDK", "purpose": "Growth chart", "startFrame": 15, "durationInFrames": 135 },
                { "id": "toast-1", "primitiveName": "PushNotificationToast", "sdkCategory": "CardSDK", "purpose": "Alert", "startFrame": 30, "durationInFrames": 60 },
                { "id": "cursor-1", "primitiveName": "Cursor", "sdkCategory": "MotionSDK", "purpose": "Click card", "startFrame": 45, "durationInFrames": 45 }
            ]
        }
    `;

    const res = await callLLM(config, designPrompt, "Shot Blueprint", true);

    try {
        return JSON.parse(res.content.replace(/```json/gi, '').replace(/```/gi, '').trim());
    } catch {
        return {
            sceneNum,
            totalDuration: 150,
            colorTheme: defaultTheme,
            components: [
                { id: "browser-1", primitiveName: "BrowserFrame", sdkCategory: "StructuralSDK", purpose: "Container", startFrame: 0, durationInFrames: 150 },
                { id: "chart-1", primitiveName: "BarChartCard", sdkCategory: "ChartsSDK", purpose: "Chart", startFrame: 15, durationInFrames: 135 }
            ]
        };
    }
}

export async function runSingleUIComponentAgent(
    config: AgentConfig,
    compPlan: ComponentPlan,
    colorTheme: ShotDesignPlan['colorTheme']
): Promise<{ id: string; jsxBlock: string }> {
    const compPrompt = `
        You are a UI Component Agent for "${compPlan.primitiveName}".
        Generate clean static TSX code for Component ID: "${compPlan.id}".
        Purpose: "${compPlan.purpose}"
        Theme: ${JSON.stringify(colorTheme)}

        Output Only the component JSX element (e.g. <${compPlan.primitiveName} ... />).
    `;

    const res = await callLLM(config, compPrompt, `UI: ${compPlan.primitiveName}`, true);
    return { id: compPlan.id, jsxBlock: res.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim() };
}

export async function runSingleUIAnimationAgent(
    config: AgentConfig,
    compPlan: ComponentPlan,
    staticJSX: string
): Promise<string> {
    const animPrompt = `
        You are a Motion Physics Agent. Wrap this UI component in Remotion physics and a <Sequence> tag for unmounting lifespans:

        Component ID: "${compPlan.id}"
        Start Frame: ${compPlan.startFrame}
        Duration: ${compPlan.durationInFrames}
        Static JSX: ${staticJSX}

        Wrap inside:
        <Sequence from={${compPlan.startFrame}} durationInFrames={${compPlan.durationInFrames}}>
        ...
        </Sequence>
        Inject spring() and interpolate() physics for entrances. Return pure TSX code.
    `;

    const res = await callLLM(config, animPrompt, `Animate: ${compPlan.id}`, true);
    return res.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim();
}



export async function runSubagentPipeline(
    config: AgentConfig,
    scene: StoryboardSceneDef,
    sceneNum: number,
    targetSiteKey?: string
): Promise<{ SceneCode: string; error?: string }> {
    try {
        // Stage 1: Design Agent (Shot Blueprint with Design Spec)
        const designPlan = await runDesignAgent(config, scene, sceneNum, targetSiteKey);

        // Stage 2: Parallel UI Component Agents
        const uiPromises = designPlan.components.map((comp) =>
            runSingleUIComponentAgent(config, comp, designPlan.colorTheme)
        );
        const uiResults = await Promise.all(uiPromises);
        const staticMap: Record<string, string> = {};
        uiResults.forEach((res) => { staticMap[res.id] = res.jsxBlock; });

        // Stage 3: Parallel UI Animation Agents
        const animPromises = designPlan.components.map((comp) =>
            runSingleUIAnimationAgent(config, comp, staticMap[comp.id] || '')
        );
        const animatedBlocks = await Promise.all(animPromises);

        // Stage 4: Scene Assembly
        const sceneCode = `
export const Scene${sceneNum}: React.FC = () => {
    const frame = useCurrentFrame();
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ${animatedBlocks.join('\n\n            ')}
        </div>
    );
};
`;
        return { SceneCode: sceneCode };
    } catch (e) {
        console.warn(`[Pipeline] Multi-Subagent Pipeline fallback for Scene ${sceneNum}:`, e);
        // Fallback Layout & Motion Execution
        const layoutPrompt = `
            You are the Layout Subagent. Build structural JSX for Scene ${sceneNum}.
            Scene Description: ${scene.description}
            Requested Primitives: ${scene.requestedPrimitives ? scene.requestedPrimitives.join(', ') : ''}
            Export as: export const Scene${sceneNum}: React.FC = () => { ... };
            Return pure TSX code.
        `;
        const layoutRes = await callLLM(config, layoutPrompt, "Generate Layout JSX", true);
        if (!layoutRes.content) return { SceneCode: '', error: 'Subagent pipeline failed' };
        return { SceneCode: layoutRes.content.replace(/```tsx/gi, '').replace(/```/gi, '').trim() };
    }
}

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
        .replace(/```/g, '');

    const lines = cleaned.split('\n');
    const filteredLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        // Strictly filter top-level import statements and default export wrappers
        if (/^import\s+/.test(trimmed) || /^import\{/.test(trimmed)) continue;
        if (/^export\s+default\s+/.test(trimmed)) continue;
        if (/^\}?\s*from\s*['"][^'"]+['"];?/.test(trimmed)) continue;
        filteredLines.push(line);
    }

    return filteredLines.join('\n').trim();
}

export function deduplicateDeclarations(code: string): string {
    if (!code) return '';
    // Strip dummy AI 'declare const/var/let/function/type/interface' lines
    let cleaned = code.replace(/^\s*declare\s+(?:const|var|let|function|type|interface)\s+.*$/gm, '');

    const declaredTopLevelNames = new Set<string>();
    const lines = cleaned.split('\n');
    const filtered: string[] = [];
    let insideComponent = false;

    for (const line of lines) {
        if (/^export\s+const\s+(Scene\d+|VideoComposition)\b/.test(line.trim())) {
            insideComponent = true;
        }

        // Only strip duplicate declarations if they occur outside component function bodies
        if (!insideComponent) {
            const topMatch = line.match(/^\s*(?:export\s+)?const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
            if (topMatch) {
                const varName = topMatch[1];
                if (declaredTopLevelNames.has(varName)) {
                    console.warn(`[sanitize] Stripped top-level AI duplicate declaration: ${varName}`);
                    continue;
                }
                declaredTopLevelNames.add(varName);
            }
        }
        filtered.push(line);
    }

    return filtered.join('\n');
}

export function sanitizeCompositionCode(code: string): string {
    if (!code) return '';
    let bodyWithoutImports = stripAllImports(code);
    if (!bodyWithoutImports || bodyWithoutImports.trim().length === 0) return '';

    // Convert comment JSX {/* Scene X */} to <SceneX />
    bodyWithoutImports = bodyWithoutImports.replace(/\{\/\*\s*Scene\s+(\d+)\s*\*\/\}/gi, '<Scene$1 />');

    // Deduplicate variable & type declarations
    bodyWithoutImports = deduplicateDeclarations(bodyWithoutImports);

    let defaultExportSuffix = '';
    if (!bodyWithoutImports.includes('export default')) {
        defaultExportSuffix = '\nexport default VideoComposition;\n';
    }

    if (!bodyWithoutImports.includes('export const VideoComposition')) {
        bodyWithoutImports += `
export const VideoComposition: React.FC<{ bgSelection?: any }> = ({ bgSelection }) => {
    const bgType = bgSelection?.type || 'color';
    const bgColor = bgSelection?.color || '#09090b';
    const bgGradient = bgSelection?.gradient || '';
    const bgImage = bgSelection?.imageUrl || '';
    const blurPx = bgSelection?.blurPx || 0;

    let backdropStyle: React.CSSProperties = { backgroundColor: bgColor };
    if (bgType === 'gradient' && bgGradient) {
        backdropStyle = { background: bgGradient };
    } else if (bgType === 'image' && bgImage) {
        backdropStyle = {
            backgroundImage: \`url("\${bgImage}")\`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blurPx > 0 ? \`blur(\${blurPx}px)\` : undefined,
            transform: blurPx > 0 ? 'scale(1.08)' : undefined,
        };
    } else if (bgColor === 'transparent') {
        backdropStyle = { backgroundColor: 'transparent' };
    }

    return (
        <div className="w-full h-full text-white relative overflow-hidden flex items-center justify-center">
            <div style={backdropStyle} className="absolute inset-0 pointer-events-none z-0 transition-all duration-200" />
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                <Series>
                    <Series.Sequence durationInFrames={180}>
                        <Scene1 />
                    </Series.Sequence>
                </Series>
            </div>
        </div>
    );
};
`;
    }

    // Convert old static VideoComposition signatures to accept bgSelection props
    bodyWithoutImports = bodyWithoutImports
        .replace(/export\s+const\s+VideoComposition:\s*React\.FC\s*=\s*\(\)\s*=>/g, 'export const VideoComposition: React.FC<{ bgSelection?: any }> = ({ bgSelection }) =>');

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
import { VectorMorph, SVG_PRESETS } from '../primitives/VectorMorph';

${bodyWithoutImports}

${defaultExportSuffix}
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
import { VectorMorph, SVG_PRESETS } from '../primitives/VectorMorph';

${cleanedBlocks.join('\n\n')}

export const VideoComposition: React.FC<{ bgSelection?: any }> = ({ bgSelection }) => {
    const bgType = bgSelection?.type || 'color';
    const bgColor = bgSelection?.color || '#09090b';
    const bgGradient = bgSelection?.gradient || 'linear-gradient(135deg, #09090b 0%, #1e1b4b 50%, #311042 100%)';
    const bgImage = bgSelection?.imageUrl || '';
    const blurPx = bgSelection?.blurPx || 0;

    let backdropStyle: React.CSSProperties = { backgroundColor: bgColor };
    if (bgType === 'gradient') {
        backdropStyle = { background: bgGradient };
    } else if (bgType === 'image' && bgImage) {
        backdropStyle = {
            backgroundImage: \`url(\${bgImage})\`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: blurPx > 0 ? \`blur(\${blurPx}px)\` : undefined,
            transform: blurPx > 0 ? 'scale(1.08)' : undefined,
        };
    } else if (bgColor === 'transparent') {
        backdropStyle = { backgroundColor: 'transparent' };
    }

    return (
        <div className="w-full h-full text-white relative overflow-hidden flex items-center justify-center">
            {/* Absolute Background Layer (Blurs ONLY the backdrop, NOT the foreground scenes) */}
            <div style={backdropStyle} className="absolute inset-0 pointer-events-none z-0 transition-all duration-200" />

            {/* Foreground Scene Layer */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                <Series>
                    ${scenes.slice(0, cleanedBlocks.length).map((s, idx) => `
                    <Series.Sequence durationInFrames={${s.duration || 150}}>
                        <Scene${idx + 1} />
                    </Series.Sequence>
                    `).join('')}
                </Series>
            </div>
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

    const voiceoverSegments = narration ? parseTimestampedScript(narration) : [];

    const detectedSiteKey = detectSiteKeyFromPrompt(prompt);

    if (isBYOC) {
        // BYOC Mode: Sequential execution scene-by-scene for prompt copy-pasting
        for (let i = startIndex; i < scenes.length; i++) {
            const scene = scenes[i];
            const sceneNum = i + 1;
            onState({ status: 'designing', progress: 0.2 + (i / scenes.length) * 0.7 });

            const res = await runSubagentPipeline(config, scene, sceneNum, detectedSiteKey);
            const code = res.SceneCode || (res as any).sceneCode;
            if (res.error || !code) {
                onState({ status: 'error', progress: 0.5, error: res.error || 'Subagent scene generation failed' });
                return '';
            }
            sceneCodeBlocks.push(code);
        }
    } else {
        // API Mode: Fast Parallel execution via Promise.all() (~6s total)
        onState({ status: 'designing', progress: 0.5 });
        const promises = scenes.slice(startIndex).map((scene, idx) =>
            runSubagentPipeline(config, scene, startIndex + idx + 1, detectedSiteKey)
        );
        const results = await Promise.all(promises);

        for (const res of results) {
            const code = res.SceneCode || (res as any).sceneCode;
            if (res.error || !code) {
                onState({ status: 'error', progress: 0.5, error: res.error || 'Parallel scene generation failed' });
                return '';
            }
            sceneCodeBlocks.push(code);
        }
    }

    // Checkpoint Save
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
        console.error("Failed to save checkpoint:", e);
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
