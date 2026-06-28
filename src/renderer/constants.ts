export const MODEL_PRESETS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
  google: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  hackclub: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'],
};

import type { TourStep } from './components/TourOverlay';

export const TOUR_STEPS: TourStep[] = [
  {
    target: 'new-project-btn',
    title: 'Create a Project',
    description: 'Click "New Project" to start building your first motion graphics video.',
    placement: 'bottom',
  },
  {
    target: 'basic-animation-card',
    title: 'Choose a Template',
    description: 'Select "Basic Animation" — the all-purpose canvas for any animated sequence.',
    placement: 'bottom',
  },
  {
    target: 'prompt-input',
    title: 'Describe Your Video',
    description: 'Type a detailed description of what you want Kinetic to animate. The more specific, the better.',
    placement: 'right',
  },
  {
    target: 'generate-btn',
    title: 'Hit Generate',
    description: 'Kick off the AI pipeline. Kinetic will write all the scene code and animation logic automatically.',
    placement: 'top',
  },
  {
    target: 'result-preview',
    title: 'See the Result',
    description: 'Your video renders here in real time. Preview, edit scenes, and export to MP4 when ready.',
    placement: 'left',
  },
];

