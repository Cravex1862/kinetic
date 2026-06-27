import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, VideoCamera, Folder, Trash, Check, Sparkle, Flag, OpenAiLogo } from '@phosphor-icons/react';
import logoIcon from '../../../kinetic_brand/logo_transparent.svg';
import { MODEL_PRESETS } from '../constants';

interface SettingsProps {
  onBack: () => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
}

type SettingsTab = 'ai' | 'video' | 'workspace' | 'danger';


const Settings: React.FC<SettingsProps> = ({ onBack, customAlert, customConfirm }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [savedToast, setSavedToast] = useState(false);

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

    // Show inline toast instead of modal
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
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
      window.location.reload();
    }
  };

  const handleRerunSetup = () => {
    localStorage.removeItem('kinetic-setup-completed');
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans page-enter">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex flex-col border-r border-gray-800/50 bg-[#0c0c0f]">
        {/* Header Title */}
        <div className="flex items-center gap-3 border-b border-gray-900 px-6 py-4">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-900 hover:text-purple-400"
            title="Return to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <img src={logoIcon} className="h-6 w-6 object-contain" alt="Kinetic" style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.45)) brightness(1.15)' }} />
          <span className="text-sm font-bold tracking-wide text-white">Settings</span>
        </div>

        {/* Tab Items List */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'ai'
                ? 'bg-purple-600/10 border border-purple-500/30 text-purple-400 shadow-md shadow-purple-500/5'
                : 'border border-transparent text-gray-400 hover:bg-gray-900/60 hover:text-gray-200'
              }`}
          >
            <Cpu size={18} />
            <span>AI Configurations</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'video'
                ? 'bg-purple-600/10 border border-purple-500/30 text-purple-400 shadow-md shadow-purple-500/5'
                : 'border border-transparent text-gray-400 hover:bg-gray-900/60 hover:text-gray-200'
              }`}
          >
            <VideoCamera size={18} />
            <span>Video & Renderer</span>
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'workspace'
                ? 'bg-purple-600/10 border border-purple-500/30 text-purple-400 shadow-md shadow-purple-500/5'
                : 'border border-transparent text-gray-400 hover:bg-gray-900/60 hover:text-gray-200'
              }`}
          >
            <Folder size={18} />
            <span>Workspace & Files</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${activeTab === 'danger'
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'border border-transparent text-gray-400 hover:bg-gray-900/60 hover:text-red-400/80'
              }`}
          >
            <Trash size={18} />
            <span>Maintenance & Reset</span>
          </button>
        </nav>

        {/* Save Settings CTA */}
        <div className="p-4 border-t border-gray-900">
          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-xl premium-button-primary py-2.5 text-sm font-bold shadow-lg shadow-purple-600/10 active:scale-[0.98] transition-all"
          >
            {savedToast ? (
              <>
                <Check size={16} weight="bold" className="text-emerald-300" />
                <span className="text-emerald-300">Saved!</span>
              </>
            ) : (
              <>
                <Check size={16} weight="bold" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 overflow-y-auto p-10">
        <div className="max-w-2xl w-full">
          {/* Tab 1: AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">AI Configurations</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Kinetic utilizes large language models to decompose scene actions, construct visual markup layouts, and auto-generate voiceover copies.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-900">
                {/* Provider Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Provider</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['openai', 'anthropic', 'google', 'hackclub'].map((key) => (
                      <button
                        key={key}
                        onClick={() => setProvider(key)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${provider === key
                            ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                            : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                          }`}
                      >
                        {key === 'openai' && (
                          <>
                            <OpenAiLogo size={16} className="text-white" />
                            <span>OpenAI</span>
                          </>
                        )}
                        {key === 'anthropic' && (
                          <>
                            <span className="font-extrabold text-amber-500 tracking-tighter text-xs select-none mr-0.5 leading-none">A\</span>
                            <span>Anthropic</span>
                          </>
                        )}
                        {key === 'google' && (
                          <>
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                            </svg>
                            <span>Google</span>
                          </>
                        )}
                        {key === 'hackclub' && (
                          <>
                            <div className="h-3.5 w-3.5 rounded-full bg-orange-600 flex items-center justify-center text-[9px] font-extrabold text-white font-sans select-none leading-none">
                              h
                            </div>
                            <span>HackClub</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">API Key Credentials</label>
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
                    className="w-full premium-input px-4 py-2.5 text-sm rounded-xl"
                  />
                </div>

                {/* Model Selection */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Model Selector</label>
                    <button
                      onClick={() => setUseCustomModel(!useCustomModel)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                        useCustomModel
                          ? 'border-purple-500/50 bg-purple-600/10 text-purple-300 hover:bg-purple-600/20'
                          : 'border-gray-700 bg-gray-800/60 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                      }`}
                      aria-label="Toggle custom model input"
                    >
                      <Sparkle size={11} weight="fill" />
                      <span>{useCustomModel ? 'Preset models' : 'Custom model'}</span>
                    </button>
                  </div>

                  {useCustomModel ? (
                    <input
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder="e.g. gemini-2.5-pro-preview"
                      type="text"
                      className="w-full premium-input px-4 py-2.5 text-sm rounded-xl"
                    />
                  ) : (
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full premium-input px-4 py-2.5 text-sm rounded-xl"
                    >
                      {(MODEL_PRESETS[provider] || []).map((m) => (
                        <option key={m} value={m} className="bg-gray-950 text-white">
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
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Video & Renderer Configuration</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Configure default video specifications for previews and headless Remotion MP4 compilations.
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-900">
                {/* Resolution Config */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Default Render Size</label>
                  <div className="flex gap-2">
                    {['4k', '1080p', '720p', '480p'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setResolution(val)}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all text-center ${resolution === val
                            ? 'border-purple-500 bg-purple-600/10 text-purple-300'
                            : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                          }`}
                      >
                        {val === '4k' && '4K (3840x2160)'}
                        {val === '1080p' && '1080p (1920x1080)'}
                        {val === '720p' && '720p (1280x720)'}
                        {val === '480p' && '480p (854x480)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Config */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Video Layout Frame Sizing</label>
                  <div className="flex gap-2">
                    {['16:9', '9:16'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAspectRatio(val)}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all text-center ${aspectRatio === val
                            ? 'border-purple-500 bg-purple-600/10 text-purple-300'
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Default Target FPS</label>
                  <div className="flex gap-2">
                    {[30, 60].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFps(val)}
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all text-center ${fps === val
                            ? 'border-purple-500 bg-purple-600/10 text-purple-300'
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
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Workspace & File Paths</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Manage save files, workspace folder references, and defaults locations.
                </p>
              </div>

              <div className="space-y-5 pt-4 border-t border-gray-900">
                {/* Default workspace directory picker */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Default Workspace Path</label>
                  <div className="flex gap-2">
                    <input
                      value={workspaceDir}
                      readOnly
                      placeholder="No default workspace folder selected"
                      className="flex-1 rounded-xl border border-gray-800 bg-gray-900/10 px-4 py-2.5 text-sm text-gray-400 outline-none"
                    />
                    <button
                      onClick={handleSelectWorkspace}
                      className="px-4 py-2.5 rounded-xl border border-gray-800 bg-gray-900 text-sm font-medium hover:border-purple-500/40 hover:text-purple-400 transition-colors"
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
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">App Maintenance & Resets</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Clean up caching files or perform a fresh reload configurations.
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-900">
                {/* Cache Clean widget */}
                <div className="flex items-center justify-between rounded-xl border border-gray-900 bg-gray-900/10 p-5">
                  <div className="flex flex-col gap-1 pr-6">
                    <h4 className="text-sm font-semibold text-white">Clean Render Cache</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Removes cached frames, assets, and compiled log outputs generated during video rendering runs to free up disk storage.
                    </p>
                  </div>
                  <button
                    onClick={handleClearCache}
                    className="flex-shrink-0 rounded-lg border border-gray-700 hover:border-purple-500/40 hover:text-purple-400 px-4 py-2 text-xs font-semibold text-gray-300 transition-all"
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
                {/* Dev Tools */}
                <div className="flex items-center justify-between rounded-xl border border-amber-900/30 bg-amber-950/5 p-5">
                  <div className="flex flex-col gap-1 pr-6">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-amber-400">Re-run Setup Wizard</h4>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-900/30 text-amber-500 border border-amber-800/40">DEV</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Clears the setup completion flag and reloads the app. Your API keys, projects, and folders are preserved.
                    </p>
                  </div>
                  <button
                    onClick={handleRerunSetup}
                    className="flex-shrink-0 rounded-lg bg-amber-950/20 border border-amber-900/40 hover:bg-amber-900/30 px-4 py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-all"
                  >
                    Re-run Wizard
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
