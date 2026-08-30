import { callLLM, safeParseJson } from "../llmClient";
import type { AgentConfig, DesignTokens, SceneBlueprint } from "../types";

export interface SecondBySecondEvent {
  second: number;
  timestamp: string;
  action: string;
  targetComponent: string;
  motionEffect: string;
}

export interface DetailedPerSceneStoryboard {
  sceneId: string;
  title: string;
  durationInFrames: number;
  durationInSeconds: number;
  layoutStructure: string;
  perspective3D: {
    rotateX: string;
    rotateY: string;
    perspective: string;
    transformOrigin: string;
  };
  componentList: string[];
  howEachComponentIsAnimated: string;
  exactDataToDisplay: {
    heading: string;
    subheading: string;
    metrics: Array<{ label: string; value: string; trend?: string }>;
    chartData?: { title: string; categories: string[]; values: number[] };
  };
  secondBySecondTimeline: SecondBySecondEvent[];
  transitionToNextScene: string;
}

export interface MasterStoryboardResult {
  totalDurationInFrames: number;
  totalDurationInSeconds: number;
  globalTransitionPlan: string;
  freelanceSkillsApplied: string[];
  scenes: DetailedPerSceneStoryboard[];
  fullMasterPrompt: string;
  perScenePrompts: string[];
  rawOutput: string;
}

export interface ClientInterviewQuestion {
  id: number;
  question: string;
  category:
    | "target_audience"
    | "key_metrics"
    | "visual_vibe"
    | "call_to_action"
    | "pacing";
  suggestedAnswers: string[];
}

export interface ClientInterViewAnswers {
  id: number;
  question: string;
  answer: string;
}

// ─── FREELANCE CLIENT CONSULTANT SYSTEM PROMPT ────────────────────────────────
export const FREELANCE_INTERVIEW_SYSTEM = `You are an Elite Freelance Video Creative Director & Client Consultant.
Your job: conduct a high-value discovery interview with the client before creating their video storyboard.

Given the video prompt, generate up to 5-10 sharp, insightful client discovery questions to clarify target audience, core metrics, visual tone, and primary calls to action.

CRITICAL RULE FOR SUGGESTED ANSWERS (MUST BE FROM THE CLIENT'S PERSPECTIVE):
Every item in \`suggestedAnswers\` MUST be a clear, direct choice for the client to SELECT as their response!
EXAMPLES OF PROPER CLIENT-PERSPECTIVE OPTIONS:
- Question: "Do you have existing brand guidelines?"
  Correct suggestedAnswers: ["Yes, we will provide brand specs", "No, generate a modern SaaS theme", "Use dark-mode neon theme"]
- Question: "Do you have customer testimonials to include?"
  Correct suggestedAnswers: ["Yes, include customer quotes", "No, focus purely on product UI metrics"]
- Question: "What is your target visual pacing?"
  Correct suggestedAnswers: ["Fast & high-energy (10s total)", "Clean & balanced (15s total)", "Detailed explainer (20s total)"]

NEVER output confusing agency-side phrases like "Yes, please provide" or "No, we'll provide". Write options as choices the CLIENT makes!

Return ONLY a valid JSON object matching this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Who is the primary target audience for this SaaS demo?",
      "category": "target_audience",
      "suggestedAnswers": ["DevOps & Cloud Engineers", "C-Suite Security Executives", "General IT Managers"]
    },
    {
      "id": 2,
      "question": "What core performance metric should be featured on the hero card?",
      "category": "key_metrics",
      "suggestedAnswers": ["99.99% Infrastructure Uptime", "120 Threats Blocked Live", "340ms Average Latency"]
    }
  ]
}`;

export async function runStoryboardClientInterview(
  config: AgentConfig,
  userPrompt: string,
): Promise<{
  questions: ClientInterviewQuestion[];
  fullPrompt: string;
  rawOutput: string;
}> {
  const userPromptText = `Video prompt: "${userPrompt}"\n\nGenerate discovery interview questions now. Valid JSON ONLY.`;
  const response = await callLLM(
    config,
    FREELANCE_INTERVIEW_SYSTEM,
    userPromptText,
    false,
  );

  if (response.error) throw new Error(response.error);
  const rawOutput = response.content || "";
  const parsed = safeParseJson<{ questions?: ClientInterviewQuestion[] }>(
    rawOutput,
    {},
  );

  const fallbackQuestions: ClientInterviewQuestion[] = [
    {
      id: 1,
      question: "Who is the primary target audience for this SaaS video?",
      category: "target_audience",
      suggestedAnswers: [
        "DevOps & Engineering Leads",
        "CTOs & Tech Executives",
        "Product Managers",
      ],
    },
    {
      id: 2,
      question:
        "What core performance metric should be featured on the hero card?",
      category: "key_metrics",
      suggestedAnswers: [
        "99.99% Infrastructure Uptime",
        "120 Threats Blocked Live",
        "50% Faster Deployment",
      ],
    },
    {
      id: 3,
      question: "What is the primary call to action for the ending scene?",
      category: "call_to_action",
      suggestedAnswers: [
        "Start Free Trial Now",
        "Schedule Security Audit",
        "Deploy Cluster Today",
      ],
    },
  ];

  const questions =
    Array.isArray(parsed.questions) && parsed.questions.length > 0
      ? parsed.questions
      : fallbackQuestions;

  return {
    questions,
    fullPrompt: `=== FREELANCE CLIENT CONSULTANT SYSTEM PROMPT ===\n${FREELANCE_INTERVIEW_SYSTEM}\n\n=== USER PROMPT ===\n${userPromptText}`,
    rawOutput: JSON.stringify(questions, null, 2),
  };
}

// ─── MASTER DIRECTOR AGENT SYSTEM PROMPT ─────────────────────────────────────

export const MASTER_DIRECTOR_SYSTEM = `You are a World-Class Motion Graphics Executive Creative Director.
Your job is to inspect a video prompt and design tokens, and create an overarching master video storyboard plan.

DIRECTIVES:
1. It is preferrable if you plan 3 distinct, full-featured scenes (Scene 1: Hero Command Center Intro, Scene 2: Feature & Analytics Breakdown, Scene 3: Actionable Call To Action & Deployment). BUT KEEP IN MIND YOU DONT HAVE TO MULTIPLE SCENES FOR BASIC COMPONENTS
2. Plan global seamless transitions between scenes (e.g. 3D flip 90deg, camera zoom-out).
3. Output ONLY a valid JSON object with this exact structure:

{
  "totalDurationInFrames": 300,
  "totalDurationInSeconds": 10,
  "globalTransitionPlan": "Scene 1 enters with 3D isometric tilt -> 3D flip 90deg transition to Scene 2 analytics overview.",
  "freelanceSkillsApplied": ["motion-graphics-pro", "saas-video-director", "layout-skills"],
  "sceneSummaries": [
    {
      "sceneId": "scene1",
      "title": "Hero Command Center Intro",
      "durationInFrames": 150,
      "purpose": "Overview of GuardRail Cloud Security with cluster health and threat metrics."
    }
  ]
}`;

// ─── PER-SCENE STORYBOARD SUBAGENT SYSTEM PROMPT ─────────────────────────────
export const PER_SCENE_SUBAGENT_SYSTEM = `You are a Dedicated Scene Storyboard Subagent.
Your job: fully detail EVERYTHING that happens in ONE specific scene of a motion graphics video.

YOU MUST DECIDE EVERY DETAIL FOR THIS SCENE:
1. DURATION: durationInFrames (e.g. 150) and durationInSeconds (e.g. 5).
2. LAYOUT STRUCTURE: Describe the visual layout as plain sections (e.g., "top navigation bar above a two-column hero grid with a metrics row").
3. 3D PERSPECTIVE: rotateX (e.g. "10deg"), rotateY (e.g. "-6deg"), perspective (e.g. "1200px"), transformOrigin (e.g. "center center").
4. VISUAL SECTIONS: Plan 2-4 distinct visual sections for this scene (e.g. header bar, metrics grid, chart panel, footer CTA).
5. HOW EACH SECTION IS ANIMATED: Staggered delays, fade/slide/scale entrances, cursor click moments.
6. EXACT DATA TO DISPLAY: Real non-placeholder copy, titles, metric values (e.g. 99.99%, 120 SQLi threats), and chart categories.
7. SECOND-BY-SECOND TIMELINE: Break down what happens at second 1, second 2, second 3, etc.
8. TRANSITION TO NEXT SCENE: Seamless 3D flip 90deg or camera zoom exit.

Return ONLY a valid JSON object matching this exact structure:
{
  "sceneId": "scene1",
  "title": "Hero Infrastructure Command Center",
  "durationInFrames": 150,
  "durationInSeconds": 5,
  "layoutStructure": "Top navigation bar wrapping a two-column hero grid with a metrics row on the left and an animated bar chart panel on the right.",
  "perspective3D": {
    "rotateX": "10deg",
    "rotateY": "-6deg",
    "perspective": "1200px",
    "transformOrigin": "center center"
  },
  "componentList": ["top navigation bar", "two-column metrics grid", "animated bar chart panel"],
  "howEachComponentIsAnimated": "Navigation bar fades in at frame 0 with a subtle downward drift. Metrics grid slides in from left at frame 15. Bar chart animates bars growing upward at frame 30. Cursor clicks deploy button at frame 45.",
  "exactDataToDisplay": {
    "heading": "GuardRail Security Command Center",
    "subheading": "Real-time infrastructure threat monitoring & cluster protection",
    "metrics": [
      { "label": "System Uptime", "value": "99.99%", "trend": "+0.01%" },
      { "label": "Active Protection", "value": "24/7", "trend": "Optimal" }
    ],
    "chartData": {
      "title": "Threat Detections (24h)",
      "categories": ["SQLi", "XSS", "DDoS", "Brute Force"],
      "values": [120, 85, 40, 15]
    }
  },
  "secondBySecondTimeline": [
    { "second": 1, "timestamp": "0:00-0:01", "action": "MockWindow enters with 3D isometric tilt and ambient halo glow.", "targetComponent": "MockWindow", "motionEffect": "SpringEnter delay=0" },
    { "second": 2, "timestamp": "0:01-0:02", "action": "Uptime metric card slides in from left with glowing green badge.", "targetComponent": "HeroMetricCard", "motionEffect": "SlideInOut direction=left delay=15" },
    { "second": 3, "timestamp": "0:02-0:03", "action": "Bar chart animates 4 threat bars sequentially from left to right.", "targetComponent": "BarChartCard", "motionEffect": "ChartAnimate delay=30" },
    { "second": 4, "timestamp": "0:03-0:04", "action": "Glowing cursor moves to target deploy action button and triggers click.", "targetComponent": "Cursor", "motionEffect": "Cursor targetId=deploy-btn clickFrame=35" },
    { "second": 5, "timestamp": "0:04-0:05", "action": "Scene holds final frame before 3D flip transition to next scene.", "targetComponent": "MockWindow", "motionEffect": "Hold & 3D Flip 90deg" }
  ],
  "transitionToNextScene": "3D flip 90deg along Y-axis while opacity drops to 0, replacing UI with Scene 2."
}`;

import { RelevantSkill } from "../../utils/skillRAG";

/**
 * Runs Master Director Agent + Per-Scene Subagents
 */
export async function runStoryboardAgentWithSubagents(
  config: AgentConfig,
  userPrompt: string,
  designTokens: DesignTokens,
  interviewAnswers: ClientInterViewAnswers[],
  userFeedback?: string,
  recommendedSkills?: RelevantSkill[],
): Promise<MasterStoryboardResult> {
  const ragSkillSummary =
    recommendedSkills && recommendedSkills.length > 0
      ? `\n\nRECOMMENDED CRAFT SKILLS MATCHED VIA VECTOR RAG:\n` +
        recommendedSkills
          .map(
            (s) =>
              `- ${s.name} (${s.category.toUpperCase()}): ${s.description}`,
          )
          .join("\n")
      : "";

  const masterUserPrompt = `
  VIDEO PROMPT: "${userPrompt}"
  DESIGN TOKENS: ${JSON.stringify(designTokens, null, 2)}
  ${ragSkillSummary}
  The interviewer agent conducted an interview for some details. Given below are the questions and the answer from the human:
  ${interviewAnswers?.map((question) => {
    return `Question ${question.id}: ${question.question}\n Answer: ${question.answer}`;
  }).join('\n') || ''}

  ${userFeedback ? `USER FEEDBACK / EDITS: "${userFeedback}"` : ""}

Create the overarching master video plan now. Valid JSON ONLY.`;

  // Step 1: Master Director Agent
  const masterRes = await callLLM(
    config,
    MASTER_DIRECTOR_SYSTEM,
    masterUserPrompt,
    false,
  );
  if (masterRes.error) throw new Error(masterRes.error);
  const masterParsed = safeParseJson<any>(masterRes.content || "", {});

  const sceneSummaries =
    Array.isArray(masterParsed.sceneSummaries) &&
    masterParsed.sceneSummaries.length > 0
      ? masterParsed.sceneSummaries
      : [
          {
            sceneId: "scene1",
            title: "Hero Overview",
            durationInFrames: 150,
            purpose: `Hero scene for ${userPrompt}`,
          },
        ];

  const perScenePrompts: string[] = [];
  const detailedScenes: DetailedPerSceneStoryboard[] = [];

  // Step 2: Delegate Subagents per Scene
  for (let i = 0; i < sceneSummaries.length; i++) {
    const sSummary = sceneSummaries[i];

    const subagentUserPrompt = `VIDEO PROMPT: "${userPrompt}"
DESIGN TOKENS:
  primaryColor: "${designTokens.primaryColor}"
  backgroundColor: "${designTokens.backgroundColor}"
  surfaceColor: "${designTokens.surfaceColor}"
  fontFamily: "${designTokens.fontFamily}"
${ragSkillSummary}

TARGET SCENE OVERVIEW:
  Scene ID: "${sSummary.sceneId}"
  Title: "${sSummary.title}"
  Target Duration: ${sSummary.durationInFrames || 150} frames (~${Math.round((sSummary.durationInFrames || 150) / 30)}s)
  Purpose: "${sSummary.purpose}"

Detail EVERYTHING for this specific scene now. Valid JSON ONLY.`;

    perScenePrompts.push(
      `=== SCENE ${i + 1} SUBAGENT SYSTEM PROMPT ===\n${PER_SCENE_SUBAGENT_SYSTEM}\n\n=== SCENE ${i + 1} SUBAGENT USER PROMPT ===\n${subagentUserPrompt}`,
    );

    const subRes = await callLLM(
      config,
      PER_SCENE_SUBAGENT_SYSTEM,
      subagentUserPrompt,
      false,
    );
    if (subRes.error) throw new Error(subRes.error);
    const subParsed = safeParseJson<DetailedPerSceneStoryboard>(
      subRes.content || "",
      {
        sceneId: sSummary.sceneId || `scene${i + 1}`,
        title: sSummary.title || `Scene ${i + 1}`,
        durationInFrames: sSummary.durationInFrames || 150,
        durationInSeconds: Math.round((sSummary.durationInFrames || 150) / 30),
        layoutStructure: `MockWindow wrapping ${userPrompt}`,
        perspective3D: {
          rotateX: "10deg",
          rotateY: "-6deg",
          perspective: "1200px",
          transformOrigin: "center center",
        },
        componentList: ["hero section"],
        howEachComponentIsAnimated:
          "SpringEnter entrance + Staggered SlideInOut",
        exactDataToDisplay: {
          heading: sSummary.title || "GuardRail Security",
          subheading: sSummary.purpose || "Real-time threat monitoring",
          metrics: [
            { label: "System Uptime", value: "99.99%", trend: "+0.01%" },
          ],
          chartData: {
            title: "Detections",
            categories: ["SQLi", "XSS"],
            values: [120, 85],
          },
        },
        secondBySecondTimeline: [
          {
            second: 1,
            timestamp: "0:00-0:01",
            action: "Window enters with 3D tilt",
            targetComponent: "MockWindow",
            motionEffect: "SpringEnter",
          },
        ],
        transitionToNextScene: "3D flip 90deg",
      },
    );

    detailedScenes.push(subParsed);
  }

  const fullMasterPrompt = `=== MASTER DIRECTOR SYSTEM PROMPT ===\n${MASTER_DIRECTOR_SYSTEM}\n\n=== MASTER DIRECTOR USER PROMPT ===\n${masterUserPrompt}`;

  const totalFrames = detailedScenes.reduce(
    (sum, sc) => sum + sc.durationInFrames,
    0,
  );

  return {
    totalDurationInFrames: totalFrames,
    totalDurationInSeconds: Math.round(totalFrames / 30),
    globalTransitionPlan:
      masterParsed.globalTransitionPlan ||
      "Sequential scene transitions with 3D flips and camera zooms.",
    freelanceSkillsApplied: masterParsed.freelanceSkillsApplied || [
      "motion-graphics-pro",
      "saas-video-director",
      "layout-skills",
    ],
    scenes: detailedScenes,
    fullMasterPrompt,
    perScenePrompts,
    rawOutput: JSON.stringify(
      { masterPlan: masterParsed, detailedScenes },
      null,
      2,
    ),
  };
}

export async function runStoryboardAgent(
  config: AgentConfig,
  userPrompt: string,
  interviewAnswers: ClientInterViewAnswers[],
  designTokens?: DesignTokens,
): Promise<SceneBlueprint[]> {
  const fallbackTokens: DesignTokens = designTokens || {
    fontFamily: "Inter",
    primaryColor: "#6366f1",
    backgroundColor: "#09090b",
    surfaceColor: "#18181b",
    textColor: "#f4f4f5",
    accentColor: "#f59e0b",
    secondaryColor: "#a78bfa",
    semanticColor: "#3b82f6",
    errorColor: "#ef4444",
    successColor: "#22c55e",
    neutralColor: "#64748b",
    theme: "dark",
  };

  const res = await runStoryboardAgentWithSubagents(
    config,
    userPrompt,
    fallbackTokens,
    interviewAnswers,
  );
  return res.scenes.map((sc) => ({
    id: sc.sceneId,
    purpose: sc.layoutStructure + " " + sc.howEachComponentIsAnimated,
    durationInFrames: sc.durationInFrames,
    componentList: sc.componentList,
  }));
}
