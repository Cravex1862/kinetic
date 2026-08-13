import fs from 'fs';
import path from 'path';
import type { AgentConfig, DesignTokens } from '../src/renderer/agents/types';
import {
    runPhase1DesignTokens,
    runTestStoryboardAgent,
    runTestAllScenesComposer,
    runTestSceneCompiler,
    DetailedTestBlueprint,
    Phase1DesignResult
} from '../src/renderer/agents/testPipeline';
import { findRelevantSkills, RelevantSkill } from '../src/renderer/utils/skillRAG';

// Polyfill window.electronAPI for Node.js environment
(global as any).window = {
    electronAPI: {
        readFile: async (relativePath: string) => {
            const fullPath = path.resolve(process.cwd(), relativePath);
            return fs.readFileSync(fullPath, 'utf-8');
        },
        writeFile: async (relativePath: string, content: string) => {
            const fullPath = path.resolve(process.cwd(), relativePath);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, content, 'utf-8');
            return true;
        }
    }
};

async function main() {
    const userPrompt = process.argv[2] || 'Create a high-converting SaaS product walkthrough video for GuardRail Cloud Security.';
    const hackclubKey = process.env.HACKCLUB_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let config: AgentConfig;

    if (hackclubKey) {
        config = {
            provider: 'hackclub',
            apiKey: hackclubKey,
            model: 'qwen/qwen-2.5-coder-32b-instruct'
        };
        console.log(`Provider: Hack Club (Model: qwen/qwen-2.5-coder-32b-instruct)`);
    } else if (groqKey) {
        config = {
            provider: 'groq',
            apiKey: groqKey,
            model: 'llama-3.3-70b-versatile'
        };
        console.log(`Provider: Groq (Model: llama-3.3-70b-versatile)`);
    } else {
        console.error('❌ Error: Neither HACKCLUB_API_KEY nor GROQ_API_KEY environment variable is set!');
        process.exit(1);
    }

    // ── STAGE 1: DESIGN TOKENS ──────────────────────────────────────────────────
    console.log('\n--------------------------------------------------------------------------------');
    console.log('🎨 STAGE 1: DESIGN PRESET CHECK & TOKEN GENERATION');
    console.log('--------------------------------------------------------------------------------');
    let phase1Res: Phase1DesignResult;
    try {
        phase1Res = await runPhase1DesignTokens(config, userPrompt);
        if (phase1Res.presetFound) {
            console.log(`✨ Matched Official Brand Preset: "${phase1Res.presetFound}"`);
        } else {
            console.log(`✨ Synthesized Custom Design Tokens via 2-Pass Brand Discovery:`);
            console.log(`   Requested Brands: ${phase1Res.requestedBrands.join(', ') || 'None'}`);
        }
        console.log('\nDesign Tokens Output:');
        console.log(JSON.stringify(phase1Res.designTokens, null, 2));
    } catch (err: any) {
        console.error('❌ Stage 1 Failed:', err?.message || err);
        process.exit(1);
    }

    // ── STAGE 2: STORYBOARD & BLUEPRINTING ──────────────────────────────────────
    console.log('\n--------------------------------------------------------------------------------');
    console.log('🎬 STAGE 2: HIGH-DETAIL STORYBOARD GENERATION');
    console.log('--------------------------------------------------------------------------------');
    let blueprints: DetailedTestBlueprint[] = [];
    let transitionPlan = '';
    try {
        const sbRes = await runTestStoryboardAgent(config, userPrompt, phase1Res.designTokens);
        blueprints = sbRes.blueprints;
        transitionPlan = sbRes.masterResult?.globalTransitionPlan || '3D flip 90deg seamless scene transition with camera zoom.';
        
        console.log(`✅ Storyboard Generated (${blueprints.length} scenes planned):`);
        blueprints.forEach((bp, idx) => {
            console.log(`\n   Scene #${idx + 1}: ${bp.title} (${bp.durationInFrames} frames)`);
            console.log(`     Layout: ${bp.layoutStructure}`);
            console.log(`     Copy: "${bp.exactCopy.heading}" — "${bp.exactCopy.subheading}"`);
            console.log(`     Components: ${bp.componentList.join(', ')}`);
        });
    } catch (err: any) {
        console.error('❌ Stage 2 Failed:', err?.message || err);
        process.exit(1);
    }

    // ── STAGE 3: VECTOR RAG SKILL RETRIEVAL ─────────────────────────────────────
    console.log('\n--------------------------------------------------------------------------------');
    console.log('🔍 STAGE 3: VECTOR RAG KNOWLEDGE MATCHING');
    console.log('--------------------------------------------------------------------------------');
    let matchedSkills: RelevantSkill[] = [];
    try {
        const queryText = `${userPrompt} ${blueprints.map(b => b.componentList.join(' ')).join(' ')}`;
        matchedSkills = await findRelevantSkills(queryText, 2, 'layout');
        console.log(`✅ Matched ${matchedSkills.length} relevant layout skills:`);
        matchedSkills.forEach((s, idx) => {
            console.log(`   ${idx + 1}. [${s.name}] (${(s.score * 100).toFixed(1)}% match) — ${s.description}`);
        });
    } catch (err: any) {
        console.warn('⚠️ Stage 3 Vector RAG fallback:', err?.message || err);
    }

    // ── STAGE 4: MULTI-SCENE REACT & ANIMATION GENERATOR ───────────────────────
    console.log('\n--------------------------------------------------------------------------------');
    console.log('⚡ STAGE 4: 2-PASS SCENE CODE & ANIMATION GENERATOR');
    console.log('--------------------------------------------------------------------------------');
    let multiSceneRes: any;
    try {
        multiSceneRes = await runTestAllScenesComposer(config, blueprints, phase1Res.designTokens, matchedSkills);
        console.log(`✅ Code generated for all ${multiSceneRes.sceneResults.length} scenes!`);
        multiSceneRes.sceneResults.forEach((sr: any, idx: number) => {
            console.log(`\n   Scene #${idx + 1} TSX Length: ${sr.pass2.sceneTSX.length} chars`);
            console.log(`   Primitives Used: ${sr.pass1.requests.requestedPrimitives.join(', ') || 'Default'}`);
        });
    } catch (err: any) {
        console.error('❌ Stage 4 Failed:', err?.message || err);
        process.exit(1);
    }

    // ── STAGE 5: SCENE COMPILER & CODE VERIFIER AGENT ───────────────────────────
    console.log('\n--------------------------------------------------------------------------------');
    console.log('🔨 STAGE 5: SCENE COMPILER & VERIFIER AGENT PASS');
    console.log('--------------------------------------------------------------------------------');
    try {
        const scenesToCompile = multiSceneRes.sceneResults;
        const compilerRes = await runTestSceneCompiler(config, scenesToCompile, transitionPlan, phase1Res.designTokens);
        
        console.log(`✅ Final Video Composition Compiled successfully!`);
        console.log(`   Final File Output Size: ${compilerRes.compiledTSX.length} characters`);
        
        // Write composition to disk
        await (global as any).window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', compilerRes.compiledTSX);
        console.log(`💾 Saved result to src/renderer/scenes/VideoComposition.tsx`);
        
    } catch (err: any) {
        console.error('❌ Stage 5 Failed:', err?.message || err);
        process.exit(1);
    }

    console.log('\n================================================================================');
    console.log('🎉 PIPELINE CLI EXECUTION COMPLETE');
    console.log('================================================================================\n');
}

main();
