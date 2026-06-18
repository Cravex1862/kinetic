import React, { useState, useEffect } from 'react';
import type { ProjectData } from './AppRouter';

type Provider = 'openai' | 'anthropic' | 'google' | 'hackclub';

interface DashboardProps {
  onNewProject: () => void;
  onOpenProject: (p: ProjectData) => void;
  projects: ProjectData[];
}

const PROVIDERS: { key: Provider; label: string; placeholder: string }[] = [
  { key: 'openai', label: 'OpenAI', placeholder: 'sk-proj-...' },
  { key: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
  { key: 'google', label: 'Google', placeholder: 'AIza...' },
  { key: 'hackclub', label: 'HackClub', placeholder: 'hckc_...' },
];

const Dashboard: React.FC<DashboardProps> = ({ onNewProject, onOpenProject, projects }) => {
  const [showSetup, setShowSetup] = useState(false);
  const [provider, setProvider] = useState<Provider>('openai');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const seen = localStorage.getItem('kinetic-api-key');
    if (!seen) setShowSetup(true);
  }, []);

  const saveSetup = () => {
    if (apiKey.trim()) {
      localStorage.setItem('kinetic-api-key', apiKey.trim());
      localStorage.setItem('kinetic-provider', provider);
    }
    setShowSetup(false);
  };

  const skipSetup = () => {
    setShowSetup(false);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-950 text-white">

      {/* Setup Popup */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-8 shadow-2xl">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold">K</div>
            <h2 className="mt-4 text-xl font-semibold text-white">Configure AI Provider</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Kinetic uses an LLM to convert your prompts into scene definitions.
              Choose a provider and enter your API key.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</label>
                <div className="flex gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setProvider(p.key)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        provider === p.key
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                          : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</label>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={PROVIDERS.find((p) => p.key === provider)?.placeholder}
                  type="password"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={skipSetup}
                className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-200"
              >
                Skip
              </button>
              <button
                onClick={saveSetup}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='absolute top-6 right-6'>
        <button onClick={()=> setShowSetup(true)} className='flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white transition-colors' title='Config API Keys'> ⚙️ </button>
      </div>


      {/* Logo */}
      <div className="mb-12 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-bold shadow-lg shadow-indigo-600/25">
          K
        </div>
        <h1 className="text-lg font-semibold text-white">kinetic</h1>
      </div>

      {/* New Project Button */}
      <button
        onClick={onNewProject}
        className="flex items-center gap-3 rounded-xl border-2 border-dashed border-indigo-600/40 px-10 py-4 text-indigo-400 transition-colors hover:border-indigo-400 hover:bg-indigo-600/5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">+</span>
        <span className="text-base font-medium">New Project</span>
      </button>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div className="mt-12 w-full max-w-lg">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-600">Recent Projects</h2>
          <div className="space-y-2">
            {projects.map((p, i) => (
              <button
                key={i}
                onClick={() => onOpenProject(p)}
                className="flex w-full items-center rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-left transition-colors hover:border-gray-700"
              >
                <span className="text-sm font-medium text-white">{p.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {projects.length === 0 && (
        <p className="mt-8 text-xs text-gray-700">No recent projects</p>
      )}
    </div>
  );
};

export default Dashboard;
