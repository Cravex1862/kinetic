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

export const MOCK_TOUR_PROJECT = {
  title: 'SaaS Dashboard Demo',
  prompt: 'Create a clean dashboard animation with a purple bar chart rising',
  narration: 'Here is our new dashboard showing user growth over the last quarter.',
  savePath: 'tour-mock-project.json',
  scenes: [
    {
      sceneId: 'scene-1',
      description: 'Dashboard Intro',
      duration: 4,
      narration: 'Here is our new dashboard showing user growth over the last quarter.',
      captions: ['Here is our new dashboard showing user growth over the last quarter.'],
      keyframes: [],
      components: [
        {
          type: 'BrowserFrame',
          props: {
            id: 'root-browser',
            title: 'kineticapp.dev/dashboard',
            theme: 'dark'
          },
          children: [
            {
              type: 'SidebarLayout',
              props: {
                id: 'dashboard-layout',
                activeTab: 'Overview'
              },
              children: [
                {
                  type: 'CustomCard',
                  props: {
                    id: 'bar-chart-card',
                    title: 'Monthly Active Users',
                    subtitle: 'Up 15% this month'
                  },
                  children: [
                    {
                      type: 'BarChart',
                      props: {
                        id: 'ma-chart',
                        data: [
                          { label: 'Jan', value: 30 },
                          { label: 'Feb', value: 45 },
                          { label: 'Mar', value: 60 },
                          { label: 'Apr', value: 80 }
                        ],
                        color: '#8b5cf6'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};



