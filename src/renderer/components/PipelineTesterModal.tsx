import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Sparkle, Code, CheckCircle, Eye, Terminal, ArrowRight, Desktop } from '@phosphor-icons/react';
import { Player } from '@remotion/player';
import VideoComposition from '../scenes/VideoComposition';
import { runDesignAgent } from '../agents/subagents/designAgent';
import { runAnimatorDiscovery, runAnimatorGeneratorAgent } from '../agents/subagents/animatorAgent';
import { findRelevantSkills, RelevantSkill } from '../utils/skillRAG';
import { getStoredConfig } from '../agents/llmClient';
import type { AgentConfig, DesignTokens } from '../agents/types';
import {
  runPhase1DesignTokens,
  runTestStoryboardAgent,
  runTestSceneDiscovery,
  runTestSceneGeneratorAgent,
  runTestAllScenesComposer,
  runTestSceneCompiler,
  MultiSceneComposerResult,
  DetailedTestBlueprint,
  Phase1DesignResult,
} from '../agents/testPipeline';
import { runStoryboardClientInterview, ClientInterviewQuestion } from '../agents/subagents/storyboardAgent';

interface PipelineTesterModalProps {
  onClose: () => void;
}

interface StepData {
  fullPrompt?: string;
  rawOutput?: string;
  ragSkills?: RelevantSkill[];
  data?: any;
}

export const PipelineTesterModal: React.FC<PipelineTesterModalProps> = ({ onClose }) => {
  const [promptText, setPromptText] = useState(
    'Create a high-converting SaaS product walkthrough video for GuardRail Cloud Security.'
  );
  const [activeStep, setActiveStep] = useState<number>(1);
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'output' | 'prompt' | 'preview'>('output');
  const [previewKey, setPreviewKey] = useState<number>(0);

  // Step Data Storage
  const [step1, setStep1] = useState<StepData | null>(null); // Design Tokens
  const [step2, setStep2] = useState<StepData | null>(null); // Ultra-Detailed Storyboard
  const [step3, setStep3] = useState<StepData | null>(null); // Vector RAG Skills
  const [step4, setStep4] = useState<StepData | null>(null); // Multi-Component Scene Creator
  const [step5, setStep5] = useState<StepData | null>(null); // Animator Agent

  // Phase 1 Design Approval & Feedback State
  const [designApproved, setDesignApproved] = useState<boolean>(false);
  const [designFeedbackInput, setDesignFeedbackInput] = useState<string>('');
  const [designPresetName, setDesignPresetName] = useState<string | null>(null);

  const getConfig = (): AgentConfig => {
    const stored = getStoredConfig();
    if (stored) return stored;
    return { provider: 'byoc', apiKey: '', model: 'gemini-2.5-flash' };
  };

  // Sync TSX code to SandboxScene.tsx so Remotion Player updates safely
  const syncCodeToComposition = async (tsxCode: string, designTokens?: DesignTokens) => {
    if (!tsxCode) return;

    let fullFileContent = tsxCode;

    // Wrap raw TSX snippets into a complete React Component with SDK imports and Design System variables
    if (!tsxCode.includes('import React') && !tsxCode.includes('export default')) {
      const primaryColor = designTokens?.primaryColor || '#6366f1';
      const secondaryColor = designTokens?.secondaryColor || '#818cf8';
      const accentColor = designTokens?.accentColor || '#f59e0b';
      const semanticColor = designTokens?.semanticColor || '#3b82f6';
      const errorColor = designTokens?.errorColor || '#ef4444';
      const successColor = designTokens?.successColor || '#22c55e';
      const neutralColor = designTokens?.neutralColor || '#27272a';
      const surfaceColor = designTokens?.surfaceColor || '#18181b';
      const backgroundColor = designTokens?.backgroundColor || '#09090b';
      const textColor = designTokens?.textColor || '#f4f4f5';
      const fontFamily = designTokens?.fontFamily || 'Inter, sans-serif';

      fullFileContent = `import React from 'react';
import {
  BrowserFrame, MockWindow, TopNavbar, SidebarLayout, AppCanvas,
  BreadcrumbHeader, SplitHeroLayout, TabSwitcherContainer, ActionButton,
  NotificationToaster, HeroMetricCard, DataGridContainer
} from '../primitives/StructuralSDK';
import {
  FeatureCard, GlassmorphicCard, KanbanTaskCard, NotificationCard,
  PricingPlanCard, PriceCard, ProfileCard, SettingsToggleCard,
  CustomCard, FeatureBenefitCard, BillingInvoiceCard, PushNotificationToast,
  RegularCard, ProfileHeaderCard
} from '../primitives/CardSDK';
import {
  BarChartCard, AreaChartCard, LineChartCard, DonutChartCard,
  MetricFunnelCard, PieChartCard, ScatterPlotCard, StockCard
} from '../primitives/ChartsSDK';
import {
  SpringEnter, FadeBlur, SlideInOut, ScaleUp, StaggerContainer
} from '../primitives/TransitionSDK';
import {
  Cursor, TextTyper, FocusZoom, ChartAnimate, ProgressRing,
  MarqueeTrack, TypingGhostCursor
} from '../primitives/MotionSDK';

export default function SandboxScene() {
  const primaryColor = "${primaryColor}";
  const secondaryColor = "${secondaryColor}";
  const accentColor = "${accentColor}";
  const semanticColor = "${semanticColor}";
  const errorColor = "${errorColor}";
  const successColor = "${successColor}";
  const neutralColor = "${neutralColor}";
  const surfaceColor = "${surfaceColor}";
  const backgroundColor = "${backgroundColor}";
  const textColor = "${textColor}";
  const fontFamily = "${fontFamily}";

  return (
    <div style={{ width: 1920, height: 1080, backgroundColor, color: textColor, fontFamily, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      ${tsxCode}
    </div>
  );
}
`;
    }

    try {
      const api = (window as any).electronAPI;
      if (api?.writeFile) {
        await api.writeFile('src/renderer/scenes/SandboxScene.tsx', fullFileContent);
        await api.writeFile('src/renderer/scenes/VideoComposition.tsx', fullFileContent);
        setPreviewKey((prev) => prev + 1);
      }
    } catch (err) {
      console.warn('[PipelineTester] Failed to sync code to SandboxScene.tsx:', err);
    }
  };

  // Step 1: Design Preset Check or Design Agent Generation
  const runStep1 = async (customFeedback?: string) => {
    setLoadingStep(1);
    setDesignApproved(false);
    try {
      const config = getConfig();
      const res: Phase1DesignResult = await runPhase1DesignTokens(config, promptText, customFeedback);

      setDesignPresetName(res.presetFound);

      const fullPromptText = `================================================================================
=== SYSTEM PROMPT ===
================================================================================
${res.fullSystemPrompt}

================================================================================
=== USER PROMPT ===
================================================================================
${res.fullUserPrompt}`;

      setStep1({
        fullPrompt: fullPromptText,
        rawOutput: res.rawOutput,
        data: res.designTokens,
      });
    } catch (err: any) {
      setStep1({ rawOutput: `Error running Design Agent: ${err?.message || err}` });
    } finally {
      setLoadingStep(null);
    }
  };


  // Phase 2 Storyboard Approval & Feedback State
  const [storyboardApproved, setStoryboardApproved] = useState<boolean>(false);
  const [storyboardFeedbackInput, setStoryboardFeedbackInput] = useState<string>('');
  const [storyboardMasterResult, setStoryboardMasterResult] = useState<any | null>(null);
  const [storyboardRagSkills, setStoryboardRagSkills] = useState<RelevantSkill[]>([]);

  // Freelance Client Interview State
  const [interviewQuestions, setInterviewQuestions] = useState<ClientInterviewQuestion[]>([]);
  const [userInterviewAnswers, setUserInterviewAnswers] = useState<Record<number, string>>({});
  const [showInterviewCard, setShowInterviewCard] = useState<boolean>(false);

  // Generate Freelance Client Discovery Questions
  const runClientInterview = async () => {
    setLoadingStep(2);
    try {
      const config = getConfig();
      const res = await runStoryboardClientInterview(config, promptText);
      setInterviewQuestions(res.questions);
      setStep2({
        fullPrompt: res.fullPrompt,
        rawOutput: res.rawOutput,
        data: null,
      });
      setShowInterviewCard(true);
    } catch (err: any) {
      console.warn('[PipelineTester] Failed to run client interview, proceeding to storyboard:', err);
      runStep2();
    } finally {
      setLoadingStep(null);
    }
  };

  // Step 2: High-Detail Storyboard Agent with Subagent Delegation (testPipeline.ts)
  const runStep2 = async (customFeedback?: string) => {
    const tokens = step1?.data || {
      fontFamily: 'Inter',
      primaryColor: '#6366f1',
      backgroundColor: '#09090b',
      surfaceColor: '#18181b',
      accentColor: '#f59e0b',
      textColor: '#f4f4f5',
    };

    // Combine user interview answers into feedback context string
    let interviewContextStr = '';
    const answerEntries = Object.entries(userInterviewAnswers);
    if (answerEntries.length > 0) {
      interviewContextStr = '\n\nCLIENT INTERVIEW ANSWERS:\n' +
        interviewQuestions.map(q => `- Question: "${q.question}" -> Answer: "${userInterviewAnswers[q.id] || 'Not specified'}"`).join('\n');
    }

    const combinedFeedback = (interviewContextStr + (customFeedback ? `\n\nUSER EDITS: ${customFeedback}` : '')).trim();

    setLoadingStep(2);
    setStoryboardApproved(false);
    setShowInterviewCard(false);
    try {
      const config = getConfig();
      const res = await runTestStoryboardAgent(config, promptText, tokens, combinedFeedback);

      setStoryboardMasterResult(res.masterResult);
      if (res.ragSkills) {
        setStoryboardRagSkills(res.ragSkills);
      }

      setStep2({
        fullPrompt: res.fullPrompt,
        rawOutput: res.rawOutput,
        data: res.blueprints,
      });
    } catch (err: any) {
      setStep2({ rawOutput: `Error running High-Detail Storyboard Agent: ${err?.message || err}` });
    } finally {
      setLoadingStep(null);
    }
  };


  // Step 3: Vector RAG Retrieval
  const runStep3 = async () => {
    setLoadingStep(3);
    try {
      const bps: DetailedTestBlueprint[] = step2?.data || [
        {
          id: 'scene1',
          title: 'GuardRail Hero Command Center',
          durationInFrames: 150,
          layoutStructure: 'MockWindow container wrapping a 2-column hero grid with HeroMetricCard and BarChartCard.',
          exactCopy: {
            heading: 'GuardRail Cloud Security',
            subheading: 'Real-time infrastructure threat detection',
            metrics: [{ label: 'System Uptime', value: '99.99%' }],
          },
          componentList: ['MockWindow', 'HeroMetricCard', 'BarChartCard'],
          visualDirectives: 'Use surfaceColor for window backdrop.',
        },
      ];

      const queryText = `${promptText} ${bps[0].componentList.join(' ')}`;
      const skills = await findRelevantSkills(queryText, 2, 'layout');

      const fullPrompt = `=== VECTOR RAG QUERY (LAYOUT CATEGORY ONLY) ===\nTarget Query Text: "${queryText}"\nCategory Filter: 'layout'\nModel: Xenova/all-mpnet-base-v2 (768-dim ONNX)\nEmbedding Match: 100% Vector Cosine Similarity against layout skills`;

      setStep3({
        fullPrompt,
        ragSkills: skills,
        rawOutput: skills.map((s, i) => `=== MATCH #${i + 1}: ${s.name} (${s.category.toUpperCase()}) — ${(s.score * 100).toFixed(1)}% MATCH ===\nDescription: ${s.description}\n\n${s.cleanContent}`).join('\n\n' + '─'.repeat(60) + '\n\n'),
        data: skills,
      });
    } catch (err: any) {
      setStep3({ rawOutput: `Error running Vector RAG: ${err?.message || err}` });
    } finally {
      setLoadingStep(null);
    }
  };

  // Multi-Scene Composition State
  const [multiSceneResult, setMultiSceneResult] = useState<MultiSceneComposerResult | null>(null);

  // Step 4: 2-Pass Agentic Scene Generator for ALL Scenes (testPipeline.ts)
  const runStep4 = async () => {
    const tokens = step1?.data || {
      fontFamily: 'Inter',
      primaryColor: '#6366f1',
      backgroundColor: '#09090b',
      surfaceColor: '#18181b',
      accentColor: '#f59e0b',
      textColor: '#f4f4f5',
    };
    const bps: DetailedTestBlueprint[] = step2?.data || [
      {
        id: 'scene1',
        title: 'GuardRail Hero Command Center',
        durationInFrames: 150,
        layoutStructure: 'MockWindow container wrapping a 2-column hero grid with HeroMetricCard and BarChartCard.',
        exactCopy: {
          heading: 'GuardRail Cloud Security',
          subheading: 'Real-time infrastructure threat detection',
          metrics: [{ label: 'System Uptime', value: '99.99%', trend: '+0.01%' }],
          chartData: {
            title: 'Threat Detections (24h)',
            categories: ['SQLi', 'XSS', 'DDoS', 'Brute Force'],
            values: [120, 85, 40, 15],
          },
        },
        componentList: ['MockWindow', 'HeroMetricCard', 'BarChartCard'],
        visualDirectives: 'Use surfaceColor for window backdrop.',
      },
    ];
    const skills: RelevantSkill[] = step3?.data || [];

    setLoadingStep(4);
    try {
      const config = getConfig();

      // Run 2-Pass Scene Composer for ALL Scenes in Storyboard
      const multiRes = await runTestAllScenesComposer(config, bps, tokens, skills);

      setMultiSceneResult(multiRes);

      setStep4({
        fullPrompt: multiRes.combinedPrompts,
        rawOutput: multiRes.combinedOutputs,
        data: multiRes.fullStitchedTSX,
      });
    } catch (err: any) {
      setStep4({ rawOutput: `Error running 2-Pass Multi-Scene Generator: ${err?.message || err}` });
    } finally {
      setLoadingStep(null);
    }
  };

  // Step 5: Scene Compiler Agent (3D Flip & Camera Transitions) (sceneCompilerAgent.ts)
  const runStep5 = async () => {
    const tokens = step1?.data || {
      fontFamily: 'Inter',
      primaryColor: '#6366f1',
      backgroundColor: '#09090b',
      surfaceColor: '#18181b',
      accentColor: '#f59e0b',
      textColor: '#f4f4f5',
    };
    const sceneTSX = step4?.data || '<MockWindow width={1000} height={650} visible={true}><h1>GuardRail</h1></MockWindow>';

    const scenesToCompile = multiSceneResult?.sceneResults || [
      {
        sceneId: 'scene1',
        title: 'Hero Overview',
        durationInFrames: 150,
        pass1: { requests: { requestedPrimitives: [], requestedSkills: [] }, fullPrompt: '', rawOutput: '' },
        pass2: { sceneTSX, fullPrompt: '', rawOutput: sceneTSX },
      },
    ];

    const transitionPlan = storyboardMasterResult?.globalTransitionPlan || '3D flip 90deg seamless scene transition with camera zoom.';

    setLoadingStep(5);
    try {
      const config = getConfig();

      // Run Scene Compiler Agent
      const res = await runTestSceneCompiler(config, scenesToCompile, transitionPlan, tokens);

      const combinedPrompt = `${res.fullSystemPrompt}\n\n================================================================================\n${res.fullUserPrompt}`;

      setStep5({
        fullPrompt: combinedPrompt,
        rawOutput: res.rawOutput,
        data: res.compiledTSX,
      });
    } catch (err: any) {
      setStep5({ rawOutput: `Error running Scene Compiler Agent: ${err?.message || err}` });
    } finally {
      setLoadingStep(null);
    }
  };

  const triggerCurrentStepAction = () => {
    switch (activeStep) {
      case 1: runStep1(); break;
      case 2: runClientInterview(); break;
      case 3: runStep3(); break;
      case 4: runStep4(); break;
      case 5: runStep5(); break;
    }
  };

  const getActiveStepData = (): StepData | null => {
    switch (activeStep) {
      case 1: return step1;
      case 2: return step2;
      case 3: return step3;
      case 4: return step4;
      case 5: return step5;
      default: return null;
    }
  };

  const currentData = getActiveStepData();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col h-[100vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Test Pipeline Debugger Sandbox
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Ctrl+Shift+S
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Connected to testPipeline.ts — High-Detail Storyboard + Live Visual Remotion Player
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Prompt Input Banner */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800/80 flex items-center gap-3">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Enter test prompt..."
            className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-sans"
          />
          <button
            onClick={triggerCurrentStepAction}
            disabled={loadingStep !== null}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-purple-600/20"
          >
            {loadingStep === activeStep ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={14} weight="fill" />
            )}
            {currentData ? `Re-run Step #${activeStep}` : `Run Step #${activeStep}`}
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between overflow-x-auto gap-2">
          {[
            { id: 1, label: '1. Design Tokens', data: step1 },
            { id: 2, label: '2. High-Detail Storyboard', data: step2 },
            { id: 3, label: '3. Vector RAG Skills', data: step3 },
            { id: 4, label: '4. Full Scene Creator', data: step4 },
            { id: 5, label: '5. Scene Compiler Agent', data: step5 },
          ].map((step) => {
            const isLoading = loadingStep === step.id;
            const isActive = activeStep === step.id;
            const isDone = !!step.data;

            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400'
                  : isDone
                    ? 'bg-zinc-900 text-emerald-400 border border-emerald-500/40'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
              >
                {isLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isDone ? (
                  <CheckCircle size={14} weight="fill" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-zinc-600" />
                )}
                {step.label}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="px-6 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('output')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${viewMode === 'output'
                ? 'bg-zinc-800 text-purple-300 border border-purple-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <Eye size={14} /> AI Response Output
            </button>
            <button
              onClick={() => setViewMode('prompt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${viewMode === 'prompt'
                ? 'bg-zinc-800 text-purple-300 border border-purple-500/40'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <Terminal size={14} /> Full Complete Prompt
            </button>
            <button
              onClick={async () => {
                setViewMode('preview');
                if (step4?.data) {
                  await syncCodeToComposition(step5?.data || step4?.data);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${viewMode === 'preview'
                ? 'bg-purple-600 text-white border border-purple-400 shadow-md shadow-purple-600/30'
                : 'text-purple-400 hover:text-purple-300 bg-purple-500/10 border border-purple-500/30'
                }`}
            >
              <Desktop size={14} weight="bold" /> 👁️ Live Visual Preview
            </button>
          </div>

          {!currentData && (
            <button
              onClick={triggerCurrentStepAction}
              disabled={loadingStep !== null}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
            >
              Click to Run Step #{activeStep} <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Main View Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-950/90 font-mono space-y-4">
          {/* Permanent Design Tokens Widget Header */}
          {step1?.data && viewMode !== 'preview' && (
            <div className="bg-zinc-900/90 border border-purple-500/30 rounded-xl p-3 font-sans space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                    {designPresetName ? `✨ Official Brand Preset: "${designPresetName}"` : '🎨 Active Design Tokens'}
                  </span>
                  {designApproved && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                      ✓ Approved
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    Font: <strong className="text-zinc-300">{step1.data.fontFamily || 'Inter'}</strong>
                  </span>
                </div>
                {activeStep === 1 && (
                  <button
                    onClick={() => setDesignApproved(true)}
                    className={`px-3 py-1 font-bold text-[11px] rounded-lg transition-all ${designApproved ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                  >
                    {designApproved ? '✓ Approved' : 'Approve Tokens'}
                  </button>
                )}
              </div>

              {/* Visual Swatches Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs">
                {[
                  { label: 'Primary', color: step1.data.primaryColor },
                  { label: 'Secondary', color: step1.data.secondaryColor },
                  { label: 'Accent', color: step1.data.accentColor },
                  { label: 'Background', color: step1.data.backgroundColor },
                  { label: 'Surface', color: step1.data.surfaceColor },
                  { label: 'Text', color: step1.data.textColor },
                ].map((swatch, idx) => (
                  <div key={idx} className="bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-md border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: swatch.color }}
                    />
                    <div className="truncate">
                      <p className="text-[9px] text-zinc-400 font-semibold leading-tight">{swatch.label}</p>
                      <p className="font-mono text-white text-[10px] truncate">{swatch.color}</p>
                    </div>
                  </div>
                ))}
              </div>

              {activeStep === 1 && (
                <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={designFeedbackInput}
                    onChange={(e) => setDesignFeedbackInput(e.target.value)}
                    placeholder='Request token edits (e.g. "Make primary color cyan #06b6d4 and font Outfit")...'
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      if (designFeedbackInput.trim()) {
                        runStep1(designFeedbackInput);
                        setDesignFeedbackInput('');
                      }
                    }}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-bold text-xs rounded-lg transition-colors border border-purple-500/30 whitespace-nowrap"
                  >
                    Request Edits
                  </button>
                </div>
              )}
            </div>
          )}

          {viewMode === 'preview' ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-w-4xl aspect-video relative rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-black">
                <Player
                  key={`pipeline_preview_${previewKey}`}
                  component={VideoComposition}
                  durationInFrames={150}
                  compositionWidth={1920}
                  compositionHeight={1080}
                  fps={30}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  controls
                  autoPlay
                  loop
                />
              </div>
              <p className="text-xs text-zinc-500 font-sans">
                Live 60 FPS Remotion Preview Player rendering generated scene composition
              </p>
            </div>
          ) : (!currentData && !(activeStep === 2 && showInterviewCard)) ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-3">
              <Code size={40} className="text-zinc-700" />
              <p className="text-sm font-sans">
                Click <span className="text-purple-400 font-bold">"Run Step #{activeStep}"</span> above to execute this stage and inspect its full prompt & response.
              </p>
            </div>
          ) : viewMode === 'output' ? (
            <div className="space-y-4">
              {/* Freelance Client Discovery Interview Card */}
              {activeStep === 2 && showInterviewCard && interviewQuestions.length > 0 && (
                <div className="bg-zinc-900/95 border border-purple-500/40 rounded-xl p-4 font-sans space-y-3 shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40">
                        Freelance Client Discovery Interview
                      </span>
                      <span className="text-xs text-zinc-400">
                        ({interviewQuestions.length} Discovery Questions)
                      </span>
                    </div>
                    <button
                      onClick={() => runStep2()}
                      className="text-xs text-zinc-400 hover:text-white underline font-bold"
                    >
                      Skip & Generate Storyboard Directly
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300">
                    The Storyboard Agent is using its <strong>Freelance Client Skills</strong> to clarify key details before creating your video plan:
                  </p>

                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {interviewQuestions.map((q) => (
                      <div key={q.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-bold text-[10px] flex items-center justify-center border border-purple-500/40">
                            Q{q.id}
                          </span>
                          <h4 className="text-xs font-bold text-white">{q.question}</h4>
                        </div>

                        {/* Suggested Answer Chips */}
                        {q.suggestedAnswers && q.suggestedAnswers.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {q.suggestedAnswers.map((ans, aIdx) => {
                              const isSelected = userInterviewAnswers[q.id] === ans;
                              return (
                                <button
                                  key={aIdx}
                                  onClick={() => setUserInterviewAnswers(prev => ({ ...prev, [q.id]: ans }))}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${isSelected
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                                    : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                                    }`}
                                >
                                  {ans}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Custom Answer Input */}
                        <input
                          type="text"
                          value={userInterviewAnswers[q.id] || ''}
                          onChange={(e) => setUserInterviewAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Or type custom answer..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {Object.keys(userInterviewAnswers).length} of {interviewQuestions.length} answered
                    </span>
                    <button
                      onClick={() => runStep2()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center gap-1.5"
                    >
                      <Sparkle size={14} weight="fill" /> Submit Answers & Generate Storyboard
                    </button>
                  </div>
                </div>
              )}

              {/* Phase 2 Storyboard Inspection Card */}
              {activeStep === 2 && currentData?.data && !showInterviewCard && (
                <div className="bg-zinc-900/90 border border-purple-500/30 rounded-xl p-4 font-sans space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                        🎬 Master Storyboard Plan ({currentData.data.length} Scene{currentData.data.length > 1 ? 's' : ''})
                      </span>
                      {storyboardApproved && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                          ✓ Storyboard Approved
                        </span>
                      )}
                    </div>

                    {/* Freelance Skills Tags */}
                    {storyboardMasterResult?.freelanceSkillsApplied && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400 font-bold">Craft Skills:</span>
                        {storyboardMasterResult.freelanceSkillsApplied.map((skill: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommended Vector RAG Skills Banner */}
                  {storyboardRagSkills && storyboardRagSkills.length > 0 && (
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-purple-500/30 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-bold flex items-center gap-1.5">
                          🎯 Vector RAG Recommended Skills (100% Cosine Vector Match)
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Prompt Matching Active
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {storyboardRagSkills.map((s, idx) => (
                          <div key={idx} className="bg-zinc-900 px-2 py-1 rounded-md border border-zinc-700 flex items-center gap-1.5 text-[11px]">
                            <span className="text-emerald-400 font-bold">{s.name}</span>
                            <span className="text-zinc-500 text-[10px]">({s.category.toUpperCase()})</span>
                            <span className="text-purple-300 font-mono text-[10px]">{(s.score * 100).toFixed(0)}% Match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Global Transition Strategy */}
                  {storyboardMasterResult?.globalTransitionPlan && (
                    <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                      <span className="text-purple-400 font-bold">Global Transition Strategy: </span>
                      {storyboardMasterResult.globalTransitionPlan}
                    </div>
                  )}

                  {/* Detailed Per-Scene Subagent Cards */}
                  <div className="space-y-3 pt-1">
                    {storyboardMasterResult?.scenes ? (
                      storyboardMasterResult.scenes.map((sc: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <h4 className="text-xs font-bold text-white">{sc.title}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                              <span className="px-2 py-0.5 bg-zinc-900 rounded-md border border-zinc-700 text-purple-300 font-mono">
                                ⏱️ {sc.durationInSeconds}s ({sc.durationInFrames} frames)
                              </span>
                              <span className="px-2 py-0.5 bg-zinc-900 rounded-md border border-zinc-700 text-cyan-300 font-mono">
                                📐 3D Tilt: rotX={sc.perspective3D?.rotateX || '0deg'}, rotY={sc.perspective3D?.rotateY || '0deg'}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                            <strong className="text-purple-400">Layout: </strong>{sc.layoutStructure}
                          </p>

                          {/* Components List Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-zinc-400 font-bold">Components:</span>
                            {sc.componentList?.map((comp: string, cIdx: number) => (
                              <span key={cIdx} className="px-2 py-0.5 rounded-md bg-zinc-900 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                                &lt;{comp} /&gt;
                              </span>
                            ))}
                          </div>

                          {/* Second-by-Second Timeline Table */}
                          {sc.secondBySecondTimeline && (
                            <div className="pt-1">
                              <p className="text-[10px] font-bold text-zinc-400 mb-1">Second-by-Second Action Breakdown:</p>
                              <div className="space-y-1">
                                {sc.secondBySecondTimeline.map((evt: any, eIdx: number) => (
                                  <div key={eIdx} className="flex items-center gap-2 text-[11px] bg-zinc-900/60 p-1.5 rounded-md border border-zinc-800/80">
                                    <span className="text-purple-300 font-bold w-12 shrink-0">Sec {evt.second}:</span>
                                    <span className="text-zinc-300 flex-1">{evt.action}</span>
                                    <span className="text-emerald-400 text-[10px] font-mono shrink-0">[{evt.motionEffect}]</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-[11px] text-amber-400/90 pt-1 flex items-center gap-1 font-mono">
                            <span>↪ Exit Transition:</span>
                            <span>{sc.transitionToNextScene}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      currentData.data.map((bp: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
                          <h4 className="text-xs font-bold text-white">Scene #{idx + 1}: {bp.title}</h4>
                          <p className="text-xs text-zinc-300 font-mono">{bp.layoutStructure}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Interactive User Approval & Edits */}
                  <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={storyboardFeedbackInput}
                      onChange={(e) => setStoryboardFeedbackInput(e.target.value)}
                      placeholder='Request storyboard edits (e.g. "Add a second scene with a bar chart and make Scene 1 4 seconds")...'
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-sans"
                    />
                    <button
                      onClick={() => {
                        if (storyboardFeedbackInput.trim()) {
                          runStep2(storyboardFeedbackInput);
                          setStoryboardFeedbackInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-purple-300 font-bold text-xs rounded-lg transition-colors border border-purple-500/30 whitespace-nowrap font-sans"
                    >
                      Request Edits
                    </button>
                    <button
                      onClick={() => setStoryboardApproved(true)}
                      className={`px-4 py-1.5 font-bold text-xs rounded-lg transition-all whitespace-nowrap shadow-md font-sans ${storyboardApproved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/20'
                        }`}
                    >
                      {storyboardApproved ? '✓ Storyboard Approved' : 'Approve Storyboard'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider">
                <span>AI Output Response (Step #{activeStep})</span>
                <span className="text-zinc-500 font-normal font-sans">Formatted Output</span>
              </div>
              <pre className="bg-zinc-950 p-4 rounded-xl text-xs text-emerald-300 border border-zinc-800 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[45vh]">
                {currentData?.rawOutput || '// No output received yet'}
              </pre>
            </div>


          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-cyan-400 font-bold uppercase tracking-wider">
                <span>Full Complete Prompt Sent to AI (Step #{activeStep})</span>
                <span className="text-zinc-500 font-normal font-sans">System + User Combined</span>
              </div>
              <pre className="bg-zinc-950 p-4 rounded-xl text-xs text-cyan-200 border border-zinc-800 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[55vh]">
                {currentData?.fullPrompt || '// No prompt recorded for this step'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Press ESC or click X to close</span>
          <span>Shortcut: Ctrl + Shift + S</span>
        </div>
      </div>
    </div>
  );
};

export default PipelineTesterModal;
