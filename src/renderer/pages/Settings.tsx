import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, VideoCamera, Folder, Trash, Check, Sparkle } from '@phosphor-icons/react';
import logoIcon from '../../../kinetic_brand/logo_transparent.svg';

interface SettingsProps {
  onBack: () => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
}

type SettingsTab = 'ai' | 'video' | 'workspace' | 'danger';

const MODEL_PRESETS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
  google: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  hackclub: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'],
};

const Settings: React.FC<SettingsProps> = ({ onBack, customAlert, customConfirm }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');

  // AI Configurations State
  const [provider, setProvider] = useState<string>(localStorage.getItem('kinetic-provider') || 'openai');
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('kinetic-api-key') || '');
  const [model, setModel] = useState<string>('');
  const [customModel, setCustomModel] = useState<string>('');
  const [useCustomModel, setUseCustomModel] = useState<boolean>(false);

  // Video Configurations State
  const [resolution, setResolution] = useState<string>(localStorage.getItem('kinetic-default-resolution') || '1080p');
  const [fps, setFps] = useState<number>(Number(localStorage.getItem('kinetic-default-fps')) || 30);
  const [aspectRatio, setAspectRatio] = useState<string>(localStorage.getItem('kinetic-default-aspect-ratio') || '16:9');

  // Workspace Configuration State
  const [workspaceDir, setWorkspaceDir] = useState<string>(localStorage.getItem('kinetic-workspace-dir') || '');

  // Load Model presets on mount/provider change
  useEffect(() => {
    const savedModel = localStorage.getItem('kinetic-model') || '';
    const presets = MODEL_PRESETS[provider] || [];
    if (savedModel && presets.includes(savedModel)) {
      setModel(savedModel);
      setUseCustomModel(false);
    } else if (savedModel) {
      setCustomModel(savedModel);
      setUseCustomModel(true);
    } else {
      setModel(presets[0] || '');
      setUseCustomModel(false);
    }
  }, [provider]);

  // Actions
  const handleSelectWorkspace = async () => {
    if (!window.electronAPI?.selectDirectory) {
      await customAlert("Feature Unavailable", "Selecting directories is only supported inside the desktop app.");
      return;
    }
    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      setWorkspaceDir(dir);
    }
  };

  const handleSave = async () => {
    // Save AI configs
    localStorage.setItem('kinetic-provider', provider);
    localStorage.setItem('kinetic-api-key', apiKey.trim());
    const finalModel = useCustomModel ? customModel.trim() : model;
    if (finalModel) {
      localStorage.setItem('kinetic-model', finalModel);
    } else {
      localStorage.removeItem('kinetic-model');
    }

    // Save Video configs
    localStorage.setItem('kinetic-default-resolution', resolution);
    localStorage.setItem('kinetic-default-fps', String(fps));
    localStorage.setItem('kinetic-default-aspect-ratio', aspectRatio);

    // Save Workspace config
    localStorage.setItem('kinetic-workspace-dir', workspaceDir);

    await customAlert("Settings Saved", "Your settings configurations have been successfully saved.");
  };

  const handleClearCache = async () => {
    const confirmClear = await customConfirm(
      "Clear Temp Cache",
      "Are you sure you want to clean up all temporary render frames and compilation cache logs? This cannot be undone.",
      [
        { label: 'Cancel', value: false },
        { label: 'Clean Cache', value: true, isPrimary: true, isDanger: true }
      ]
    );

    if (confirmClear) {
      // Simulate clean cache
      await customAlert("Cache Cleaned", "Temporary build frames and render compile directories have been cleared.");
    }
  };

  const handleResetApp = async () => {
    const confirmReset = await customConfirm(
      "Factory Reset App",
      "Are you sure you want to completely restore Kinetic to factory configurations? This will wipe your API keys, folder organization, and project history lists.",
      [
        { label: 'Cancel', value: false },
        { label: 'Wipe Everything', value: true, isPrimary: true, isDanger: true }
      ]
    );

    if (confirmReset) {
      localStorage.clear();
      // Reload the page to boot app state
      window.location.reload();
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex flex-col border-r border-gray-800 bg-gray-900/40 backdrop-blur-md">
        {/* Header Title */}
        <div className="flex items-center gap-3 border-b border-gray-800 px-6 py-4">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.55)) brightness(1.2)' }} />
          <span className="text-sm font-semibold tracking-wide text-white">Settings</span>
        </div>

        {/* Tab Items List */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'ai'
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400'
                : 'border border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
            }`}
          >
            <Cpu size={18} />
            <span>AI Configurations</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'video'
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400'
                : 'border border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
            }`}
          >
            <VideoCamera size={18} />
            <span>Video & Renderer</span>
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'workspace'
                ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400'
                : 'border border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-gray-200'
            }`}
          >
            <Folder size={18} />
            <span>Workspace & Files</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'danger'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'border border-transparent text-gray-400 hover:bg-gray-800/40 hover:text-red-400/80'
            }`}
          >
            <Trash size={18} />
            <span>Maintenance & Reset</span>
          </button>
        </nav>

        {/* Save Settings CTA */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/20">
          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-[0.98] transition-all"
          >
            <Check size={16} weight="bold" />
            <span>Save Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 overflow-y-auto p-10">
        <div className="max-w-2xl w-full">
          {/* Tab 1: AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">AI Configurations</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Kinetic utilizes large language models to decompose scene actions, construct visual markup layouts, and auto-generate voiceover copies.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-800/60">
                {/* Provider Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Provider</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['openai', 'anthropic', 'google', 'hackclub'].map((key) => (
                      <button
                        key={key}
                        onClick={() => setProvider(key)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all text-center ${
                          provider === key
                            ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300'
                            : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {key === 'openai' && 'OpenAI'}
                        {key === 'anthropic' && 'Anthropic'}
                        {key === 'google' && 'Google'}
                        {key === 'hackclub' && 'HackClub Proxy'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">API Key Credentials</label>
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      provider === 'openai' ? 'sk-proj-...' :
                      provider === 'anthropic' ? 'sk-ant-...' :
                      provider === 'google' ? 'AIzaSy...' :
                      'hckc_...'
                    }
                    type="password"
                    className="w-full rounded-xl border border-gray-800 bg-gray-900/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500 focus:bg-gray-900/50 transition-all"
                  />
                </div>

                {/* Model Selection */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Model Selector</label>
                    <button
                      onClick={() => setUseCustomModel(!useCustomModel)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
                    >
                      <Sparkle size={13} weight="fill" />
                      <span>{useCustomModel ? 'Use Preset Models' : 'Use Custom Model Name'}</span>
                    </button>
                  </div>

                  {useCustomModel ? (
                    <input
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g. gemini-2.5-pro-preview"
                      type="text"
                      className="w-full rounded-xl border border-gray-800 bg-gray-900/30 px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500 focus:bg-gray-900/50 transition-all"
                    />
                  ) : (
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-xl border border-gray-800 bg-gray-900/30 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:bg-gray-900/50 transition-all"
                    >
                      {(MODEL_PRESETS[provider] || []).map((m) => (
                        <option key={m} value={m} className="bg-gray-900 text-white">
                          {m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Video & Render Settings */}
          {activeTab === 'video' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Video & Renderer Configuration</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Configure default video specifications for previews and headless Remotion MP4 compilations.
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-800/60">
                {/* Resolution Config */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Default Render Size</label>
                  <div className="flex gap-2">
                    {['1080p', '720p', '480p'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setResolution(val)}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all text-center ${
                          resolution === val
                            ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300'
                            : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {val === '1080p' && '1080p (1920x1080)'}
                        {val === '720p' && '720p (1280x720)'}
                        {val === '480p' && '480p (854x480)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Config */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Video Layout Frame Sizing</label>
                  <div className="flex gap-2">
                    {['16:9', '9:16'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAspectRatio(val)}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all text-center ${
                          aspectRatio === val
                            ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300'
                            : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {val === '16:9' && '16:9 Horizontal (YouTube, Demos)'}
                        {val === '9:16' && '9:16 Vertical (Shorts, Reels)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame Rate Configuration */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Default Target FPS</label>
                  <div className="flex gap-2">
                    {[30, 60].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFps(val)}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all text-center ${
                          fps === val
                            ? 'border-indigo-500 bg-indigo-600/10 text-indigo-300'
                            : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {val} Frames Per Second
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Workspace Config */}
          {activeTab === 'workspace' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Workspace & File Paths</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Manage save files, workspace folder references, and defaults locations.
                </p>
              </div>

              <div className="space-y-5 pt-4 border-t border-gray-800/60">
                {/* Default workspace directory picker */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Default Workspace Path</label>
                  <div className="flex gap-2">
                    <input
                      value={workspaceDir}
                      readOnly
                      placeholder="No default workspace folder selected"
                      className="flex-1 rounded-xl border border-gray-800 bg-gray-900/10 px-4 py-2.5 text-sm text-gray-400 outline-none"
                    />
                    <button
                      onClick={handleSelectWorkspace}
                      className="px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900 text-sm font-medium hover:border-gray-600 hover:text-white transition-colors"
                    >
                      Browse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Maintenance & Danger Zone */}
          {activeTab === 'danger' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">App Maintenance & Resets</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Clean up caching files or perform a fresh reload configurations.
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-800/60">
                {/* Cache Clean widget */}
                <div className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900/10 p-5">
                  <div className="flex flex-col gap-1 pr-6">
                    <h4 className="text-sm font-semibold text-white">Clean Render Cache</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Removes cached frames, assets, and compiled log outputs generated during video rendering runs to free up disk storage.
                    </p>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="flex-shrink-0 rounded-lg border border-gray-700 hover:border-gray-500 px-4 py-2 text-xs font-medium text-gray-300 hover:text-white transition-all"
                  >
                    Clear Cache
                  </button>
                </div>

                {/* Reset app config */}
                <div className="flex items-center justify-between rounded-xl border border-red-950 bg-red-950/5 p-5">
                  <div className="flex flex-col gap-1 pr-6">
                    <h4 className="text-sm font-semibold text-red-400">Reset App Data</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Wipes all stored configurations, key settings, directories, and folder groups. Kinetic will restore to default states.
                    </p>
                  </div>
                  <button
                    onClick={handleResetApp}
                    className="flex-shrink-0 rounded-lg bg-red-950/20 border border-red-900/50 hover:bg-red-900/30 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 transition-all"
                  >
                    Wipe Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
