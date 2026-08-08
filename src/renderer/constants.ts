export const MODEL_PRESETS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
  google: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  hackclub: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'],
  ollama: ['qwen2.5-coder', 'llama3.2', 'codellama', 'mistral', 'phi4', 'gemma2'],
  lmstudio: ['qwen2.5-coder-7b-instruct', 'llama-3.2-3b-instruct', 'local-model'],
  local: ['qwen2.5-coder', 'llama3.2', 'local-model'],
  groq: ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'deepseek-r1-distill-llama-70b'],
};

import type { TourStep } from './components/TourOverlay';

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'new-project-btn',
    title: 'Create a Project',
    description: 'Click "New Project" to start building your first motion graphics video.',
    placement: 'bottom',
    hideNext: true,
  },
  {
    target: 'basic-animation-card',
    title: 'Choose a Template',
    description: 'Select "Basic Animation" — the all-purpose canvas for any animated sequence.',
    placement: 'bottom',
    hideNext: true,
  },
  {
    target: 'prompt-input',
    title: 'Custom Instructions',
    description: 'Type a detailed prompt for Kinetic to animate. We pre-filled a sample prompt for you!',
    placement: 'right',
  },
  {
    target: 'generate-btn',
    title: 'Generate Video',
    description: 'Click "Generate" or Next to run the AI pipeline and write the animated scene code.',
    placement: 'top',
  },
  {
    target: 'result-preview',
    title: 'Explore in Studio',
    description: 'Your preloaded demo video is ready! Preview playback, fine-tune code, and export when ready.',
    placement: 'left',
  },
];

export const MOCK_TOUR_PROJECT = {
  title: 'SaaS Dashboard Demo',
  prompt: 'Create a clean dashboard animation with rising bar charts and sleek typography',
  narration: 'Here is our new dashboard showing user growth over the last quarter.',
  savePath: '',
  code: `import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

import { 
    BrowserFrame, SidebarLayout, HeroMetricCard 
} from '../primitives/StructuralSDK';
import { 
    BarChartCard 
} from '../primitives/ChartsSDK';

export const VideoComposition: React.FC<{ bgSelection?: any }> = ({ bgSelection }) => {
  const frame = useCurrentFrame();

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

  const mockChartData = [
    { label: 'Jan', value: 350, color: '#8b5cf6' },
    { label: 'Feb', value: 520, color: '#a78bfa' },
    { label: 'Mar', value: 680, color: '#c084fc' },
    { label: 'Apr', value: 950, color: '#e879f9' }
  ];

  return (
    <div className="w-full h-full text-white relative overflow-hidden flex items-center justify-center">
      <div style={backdropStyle} className="absolute inset-0 pointer-events-none z-0 transition-all duration-200" />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
      <BrowserFrame data-label="Main Browser Frame" url="kineticapp.dev/dashboard" osType="mac" width={1150} height={680}>
        <SidebarLayout data-label="Sidebar Navigation" appName="kinetic" height={680}>
          <div className="p-6 flex flex-col gap-6 w-full">
            <div className="grid grid-cols-2 gap-4">
              <HeroMetricCard
                data-label="Users Metric"
                primaryText="950,420"
                captionText="Monthly Active Users (+18.4%)"
                trend="up"
              />
              <HeroMetricCard
                data-label="Revenue Metric"
                primaryText="$1.24M"
                captionText="ARR Revenue (+24.1%)"
                trend="up"
              />
            </div>
            <BarChartCard
              data-label="Growth Chart"
              titleText="User Growth Acceleration"
              data={mockChartData}
              frame={frame}
              width={750}
              height={280}
            />
          </div>
        </SidebarLayout>
      </BrowserFrame>
      </div>
    </div>
  );
};

export default VideoComposition;
`,
  scenes: [
    {
      sceneId: 'scene-1',
      description: 'Dashboard Intro',
      duration: 4,
      narration: 'Here is our new dashboard showing user growth over the last quarter.',
      captions: ['Here is our new dashboard showing user growth over the last quarter.'],
      keyframes: [],
      components: []
    }
  ]
};



