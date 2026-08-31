import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, VideoCamera, Folder, Trash, Check, Sparkle, Flag, OpenAiLogo, ArrowsCounterClockwise, HardDrive, ChatText, Keyboard, Eye, Lightning } from '@phosphor-icons/react';
import logoIcon from '../../../kinetic_brand/logo_transparent.svg';
import { MODEL_PRESETS } from '../constants';
import { fetchAvailableModels } from '../agents/llmClient';
import { useKineticSettings } from '../hooks/useKineticSettings';

interface SettingsProps {
  onBack: () => void;
  customAlert: (title: string, message: string) => Promise<void>;
  customConfirm: (title: string, message: string, buttons?: any[]) => Promise<any>;
}

type SettingsTab = 'ai' | 'video' | 'workspace' | 'shortcuts' | 'danger';


const Settings: React.FC<SettingsProps> = ({ onBack, customAlert, customConfirm }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  const {
    provider, setProvider,
    apiKey, setApiKey,
    baseUrl, setBaseUrl,
    model, setModel,
    customModel, setCustomModel,
    useCustomModel, setUseCustomModel,
    resolution, setResolution,
    fps, setFps,
    aspectRatio, setAspectRatio,
    workspaceDir, setWorkspaceDir,
    save: saveSettings,
  } = useKineticSettings();

  const [dynamicModels, setDynamicModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);
  const [fetchStatus, setFetchStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Load Model presets on mount/provider change
  useEffect(() => {
    setFetchStatus(null);
    setDynamicModels([]);
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

  const handleFetchModels = async () => {
    setFetchingModels(true);
    setFetchStatus(null);
    try {
      const res = await fetchAvailableModels(provider as any, baseUrl || undefined, apiKey || undefined);
      if (res.models && res.models.length > 0) {
        setDynamicModels(res.models);
        setModel(res.models[0]);
        setFetchStatus({ success: true, msg: `Found ${res.models.length} model(s) available on server!` });
      } else if (res.error) {
        setFetchStatus({ success: false, msg: res.error });
      } else {
        setFetchStatus({ success: false, msg: "No models found on server." });
      }
    } catch (err: unknown) {
      setFetchStatus({ success: false, msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleSave = async () => {
    saveSettings();
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
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'ai'
              ? 'bg-[#1a1a1e] text-white border-l-[3px] border-l-purple-500'
              : 'text-gray-400 hover:bg-gray-900/60 hover:text-gray-200 border-l-[3px] border-l-transparent'
              }`}
          >
            <Cpu size={18} />
            <span>AI Configurations</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'video'
              ? 'bg-[#1a1a1e] text-white border-l-[3px] border-l-purple-500'
              : 'text-gray-400 hover:bg-gray-900/60 hover:text-gray-200 border-l-[3px] border-l-transparent'
              }`}
          >
            <VideoCamera size={18} />
            <span>Video & Renderer</span>
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'workspace'
              ? 'bg-[#1a1a1e] text-white border-l-[3px] border-l-purple-500'
              : 'text-gray-400 hover:bg-gray-900/60 hover:text-gray-200 border-l-[3px] border-l-transparent'
              }`}
          >
            <Folder size={18} />
            <span>Workspace & Files</span>
          </button>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'shortcuts'
              ? 'bg-[#1a1a1e] text-white border-l-[3px] border-l-purple-500'
              : 'text-gray-400 hover:bg-gray-900/60 hover:text-gray-200 border-l-[3px] border-l-transparent'
              }`}
          >
            <Keyboard size={18} />
            <span>Keyboard Shortcuts</span>
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${activeTab === 'danger'
              ? 'bg-red-500/10 text-red-400 border-l-[3px] border-l-red-500'
              : 'text-gray-400 hover:bg-gray-900/60 hover:text-red-400/80 border-l-[3px] border-l-transparent'
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
                  <div className="grid grid-cols-3 gap-2">
                    {['openai', 'anthropic', 'google', 'groq', 'hackclub', 'ollama', 'lmstudio', 'byoc'].map((key) => (
                      <button
                        key={key}
                        onClick={() => setProvider(key)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${provider === key
                          ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20'
                          : 'border-[#27272a] bg-[#18181b] text-gray-500 hover:border-gray-700 hover:text-gray-300'
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
                            <svg fill="currentColor" className="h-3.5 w-3.5 text-[#D97757] flex-none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"></path>
                            </svg>
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
                        {key === 'groq' && (
                          <>
                            <svg className="h-3.5 w-3.5 rounded-sm shrink-0" viewBox="0 0 201 201" xmlns="http://www.w3.org/2000/svg">
                              <path fill="#F54F35" d="M0 0h201v201H0V0Z" />
                              <path fill="#FEFBFB" d="m128 49 1.895 1.52C136.336 56.288 140.602 64.49 142 73c.097 1.823.148 3.648.161 5.474l.03 3.247.012 3.482.017 3.613c.01 2.522.016 5.044.02 7.565.01 3.84.041 7.68.072 11.521.007 2.455.012 4.91.016 7.364l.038 3.457c-.033 11.717-3.373 21.83-11.475 30.547-4.552 4.23-9.148 7.372-14.891 9.73l-2.387 1.055c-9.275 3.355-20.3 2.397-29.379-1.13-5.016-2.38-9.156-5.17-13.234-8.925 3.678-4.526 7.41-8.394 12-12l3.063 2.375c5.572 3.958 11.135 5.211 17.937 4.625 6.96-1.384 12.455-4.502 17-10 4.174-6.784 4.59-12.222 4.531-20.094l.012-3.473c.003-2.414-.005-4.827-.022-7.241-.02-3.68 0-7.36.026-11.04-.003-2.353-.008-4.705-.016-7.058l.025-3.312c-.098-7.996-1.732-13.21-6.681-19.47-6.786-5.458-13.105-8.211-21.914-7.792-7.327 1.188-13.278 4.7-17.777 10.601C75.472 72.012 73.86 78.07 75 85c2.191 7.547 5.019 13.948 12 18 5.848 3.061 10.892 3.523 17.438 3.688l2.794.103c2.256.082 4.512.147 6.768.209v16c-16.682.673-29.615.654-42.852-10.848-8.28-8.296-13.338-19.55-13.71-31.277.394-9.87 3.93-17.894 9.562-25.875l1.688-2.563C84.698 35.563 110.05 34.436 128 49Z" />
                            </svg>
                            <span>Groq</span>
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
                        {key === 'ollama' && (
                          <>
                            <svg className="h-3.5 w-3.5 shrink-0 text-white" viewBox="0 0 646 854" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M140.629 0.239929C132.66 1.52725 123.097 5.69568 116.354 10.845C95.941 26.3541 80.1253 59.2728 73.4435 100.283C70.9302 115.792 69.2138 137.309 69.2138 153.738C69.2138 173.109 71.4819 197.874 74.7309 214.977C75.4665 218.778 75.8343 222.15 75.5278 222.395C75.2826 222.64 72.2788 225.092 68.9072 227.789C57.3827 236.984 44.2029 251.145 35.1304 264.08C17.7209 288.784 6.44151 316.86 1.72133 347.265C-0.117698 359.28 -0.608106 383.555 0.863118 395.57C4.11207 423.278 12.449 446.695 26.7321 468.151L31.391 475.078L30.0424 477.346C20.4794 493.407 12.3264 516.64 8.52575 538.953C5.522 556.608 5.15419 561.328 5.15419 584.99C5.15419 608.837 5.4607 613.557 8.28054 630.047C11.6521 649.786 18.5178 670.689 26.1804 684.605C28.6938 689.141 34.8239 698.581 35.5595 699.072C35.8047 699.194 35.0691 701.462 33.9044 704.098C25.077 723.408 17.537 749.093 14.4106 770.733C12.2038 785.567 11.8973 790.349 11.8973 805.981C11.8973 825.903 13.0007 835.589 17.1692 851.466L17.7822 853.795H44.019H70.3172L68.6007 850.546C57.9957 830.93 57.0149 794.517 66.1487 758.166C70.3172 741.369 75.0374 729.048 83.8647 712.067L89.1366 701.769V695.455C89.1366 689.57 89.014 688.896 87.1137 685.034C85.6424 682.091 83.6808 679.578 80.1866 676.145C74.2404 670.383 69.9494 664.314 66.5165 656.835C51.4365 624.1 48.494 575.489 59.0991 534.049C63.5128 516.762 70.8076 501.376 78.4702 492.978C83.6808 487.215 86.378 480.779 86.378 474.097C86.378 467.17 83.926 461.469 78.4089 455.523C62.5932 438.604 52.8464 418.006 49.3522 394.038C44.3868 359.893 53.3981 322.683 73.8726 293.198C93.9181 264.263 122.055 245.689 153.503 240.724C160.552 239.559 173.732 239.743 181.088 241.092C189.119 242.502 194.145 242.072 199.295 239.62C205.67 236.617 208.858 232.877 212.597 224.295C215.907 216.633 218.482 212.464 225.409 203.821C233.746 193.461 241.776 186.411 254.649 177.89C269.362 168.266 286.097 161.278 302.771 157.906C308.839 156.68 311.659 156.496 323 156.496C334.341 156.496 337.161 156.68 343.229 157.906C367.688 162.872 391.964 175.5 411.335 193.399C415.503 197.261 425.495 209.644 428.683 214.794C429.909 216.816 432.055 221.108 433.403 224.295C437.142 232.877 440.33 236.617 446.705 239.62C451.671 242.011 456.881 242.502 464.605 241.214C476.804 239.13 486.183 239.314 498.137 241.766C538.841 249.98 574.273 283.512 589.966 328.446C603.636 367.862 599.774 409.118 579.422 440.626C575.989 445.96 572.556 450.251 567.591 455.523C556.863 466.986 556.863 481.208 567.53 492.978C585.062 512.165 596.035 559.367 592.724 600.99C590.518 628.453 583.468 653.035 573.782 666.95C572.066 669.402 568.511 673.57 565.813 676.145C562.319 679.578 560.358 682.091 558.886 685.034C556.986 688.896 556.863 689.57 556.863 695.455V701.769L562.135 712.067C570.963 729.048 575.683 741.369 579.851 758.166C588.863 794.027 588.066 829.704 577.767 849.995C576.909 851.711 576.173 853.305 576.173 853.489C576.173 853.673 587.882 853.795 602.226 853.795H628.218L628.892 851.159C629.26 849.75 629.873 847.604 630.179 846.378C630.854 843.681 632.202 835.712 633.306 828.049C634.348 820.325 634.348 791.881 633.306 783.299C629.383 752.158 622.823 727.454 612.096 704.098C610.931 701.462 610.195 699.194 610.44 699.072C610.747 698.888 612.463 696.436 614.302 693.677C627.666 673.448 635.88 648.008 640.049 614.415C641.152 605.158 641.152 565.374 640.049 556.485C637.106 533.559 633.551 517.988 627.666 502.234C625.214 495.675 618.716 481.821 615.958 477.346L614.609 475.078L619.268 468.151C633.551 446.695 641.888 423.278 645.137 395.57C646.608 383.555 646.118 359.28 644.279 347.265C639.497 316.798 628.279 288.845 610.87 264.08C601.797 251.145 588.617 236.984 577.093 227.789C573.721 225.092 570.717 222.64 570.472 222.395C570.166 222.15 570.534 218.778 571.269 214.977C578.687 176.296 578.441 128.053 570.656 90.3524C563.913 57.4951 551.653 31.3808 535.837 16.3008C523.209 4.28578 510.336 -0.863507 494.888 0.11731C459.456 2.20154 430.89 42.9667 419.61 107.21C417.771 117.57 416.178 129.708 416.178 133.018C416.178 134.305 415.932 135.347 415.626 135.347C415.319 135.347 412.929 134.121 410.354 132.589C383.014 116.405 352.608 107.762 323 107.762C293.392 107.762 262.986 116.405 235.646 132.589C233.071 134.121 230.681 135.347 230.374 135.347C230.068 135.347 229.822 134.305 229.822 133.018C229.822 129.585 228.167 117.08 226.39 107.21C216.152 49.5259 192.674 11.3354 161.472 1.71112C157.181 0.423799 144.982 -0.434382 140.629 0.239929ZM151.051 50.139C159.878 57.1273 169.686 77.1114 175.326 99.4863C176.368 103.532 177.471 108.191 177.778 109.907C178.023 111.563 178.697 115.302 179.249 118.183C181.64 131.179 182.743 145.217 182.866 162.32L182.927 179.178L178.697 185.43L174.468 191.744H164.598C153.074 191.744 141.61 193.216 130.637 196.158C126.714 197.139 122.913 198.12 122.178 198.304C121.013 198.549 120.829 198.181 120.155 193.154C116.538 165.875 116.722 135.654 120.707 110.52C125.12 82.5059 135.419 57.1273 145.472 49.6486C147.863 47.8708 148.292 47.9321 151.051 50.139ZM500.589 49.7098C506.658 54.1848 513.34 66.0772 518.305 81.2798C528.297 111.685 531.117 153.431 525.845 193.154C525.171 198.181 524.987 198.549 523.822 198.304C523.087 198.12 519.286 197.139 515.363 196.158C504.39 193.216 492.926 191.744 481.402 191.744H471.532L467.303 185.43L463.073 179.178L463.134 162.32C463.257 138.535 465.464 119.961 470.735 99.3024C476.314 77.1114 486.183 57.1273 494.949 50.139C497.708 47.9321 498.137 47.8708 500.589 49.7098Z" fill="white" />
                              <path d="M313.498 358.237C300.195 359.525 296.579 360.015 290.203 361.303C279.843 363.448 265.989 368.23 256.365 372.95C222.895 389.317 199.846 416.596 192.796 448.166C191.386 454.419 191.202 456.503 191.202 467.047C191.202 477.468 191.386 479.736 192.735 485.682C202.114 526.938 240.12 557.405 289.284 562.983C299.95 564.148 346.049 564.148 356.715 562.983C396.193 558.508 430.154 537.114 445.418 507.076C449.463 499.046 451.425 493.835 453.264 485.682C454.613 479.736 454.797 477.468 454.797 467.047C454.797 456.503 454.613 454.419 453.203 448.166C442.965 402.313 398.461 366.207 343.903 359.341C336.792 358.483 318.157 357.747 313.498 358.237ZM336.424 391.585C354.631 393.547 372.96 400.045 387.672 409.853C395.58 415.125 406.737 426.159 411.518 433.393C417.403 442.342 420.774 451.476 422.307 462.572C422.981 467.66 422.614 471.522 420.774 479.736C417.893 491.996 408.943 504.808 396.867 513.758C391.227 517.865 379.519 523.812 372.347 526.141C358.738 530.493 349.849 531.29 318.095 531.045C297.376 530.861 293.697 530.677 287.751 529.574C267.461 525.773 251.4 517.681 239.753 505.36C230.312 495.429 226.021 486.357 223.692 471.706C222.65 464.901 224.611 453.622 228.596 444.12C233.439 432.534 245.944 418.129 258.327 409.853C272.671 400.29 291.552 393.486 308.9 391.647C315.582 390.911 329.742 390.911 336.424 391.585Z" fill="white" />
                              <path d="M299.584 436.336C294.925 438.849 291.676 445.224 292.657 449.944C293.76 455.032 298.235 460.182 305.223 464.412C308.963 466.68 309.208 466.986 309.392 469.254C309.514 470.603 309.024 474.465 308.35 477.898C307.614 481.269 307.062 484.825 307.062 485.806C307.124 488.442 309.576 492.733 312.15 494.817C314.419 496.656 314.848 496.717 321.223 496.901C327.047 497.085 328.273 496.962 330.602 495.859C336.61 492.916 338.142 487.522 335.935 477.162C334.096 468.519 334.464 467.17 339.062 464.534C343.904 461.714 349.054 456.749 350.586 453.377C353.529 446.941 350.831 439.646 344.333 436.274C342.74 435.477 340.778 435.11 337.897 435.11C333.422 435.11 330.541 436.152 325.269 439.523L322.265 441.424L320.365 440.259C312.58 435.661 311.17 435.11 306.449 435.171C303.078 435.171 301.239 435.477 299.584 436.336Z" fill="white" />
                              <path d="M150.744 365.165C139.894 368.598 131.802 376.567 127.634 387.908C125.611 393.303 124.63 401.824 125.488 406.421C127.511 417.394 136.522 427.386 146.76 430.145C159.633 433.516 169.257 431.309 177.778 422.85C182.743 418.007 185.441 413.777 188.138 406.911C190.099 402.069 190.222 401.211 190.222 394.345L190.283 386.989L187.709 381.717C183.601 373.38 176.184 367.188 167.602 364.92C162.759 363.694 154.974 363.756 150.744 365.165Z" fill="white" />
                              <path d="M478.153 364.982C469.755 367.25 462.276 373.502 458.291 381.717L455.717 386.989L455.778 394.345C455.778 401.211 455.901 402.069 457.862 406.911C460.56 413.777 463.257 418.007 468.222 422.85C476.743 431.309 486.367 433.516 499.241 430.145C506.658 428.183 514.075 421.93 517.631 414.635C520.696 408.444 521.431 403.969 520.451 396.919C518.183 380.797 508.742 369.089 494.704 364.982C490.597 363.756 482.628 363.756 478.153 364.982Z" fill="white" />
                            </svg>
                            <span>Ollama</span>
                          </>
                        )}
                        {key === 'lmstudio' && (
                          <>
                            <HardDrive size={16} className="text-cyan-400" />
                            <span>LM Studio</span>
                          </>
                        )}
                        {key === 'byoc' && (
                          <>
                            <ChatText size={16} className="text-purple-400" />
                            <span>Bring Your Own Chat</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base URL Input (for local servers or custom proxies) */}
                {(provider === 'ollama' || provider === 'lmstudio' || provider === 'local') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Server Base URL</label>
                    <input
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={
                        provider === 'ollama' ? 'http://localhost:11434' :
                          provider === 'lmstudio' ? 'http://localhost:1234' :
                            'http://localhost:11434'
                      }
                      type="text"
                      className="w-full premium-input px-4 py-2.5 text-sm rounded-xl"
                    />
                  </div>
                )}

                {/* API Key Input */}
                {provider !== 'ollama' && provider !== 'lmstudio' && provider !== 'byoc' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">API Key Credentials</label>
                    <input
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        provider === 'openai' ? 'sk-proj-...' :
                          provider === 'anthropic' ? 'sk-ant-...' :
                            provider === 'google' ? 'AIzaSy...' :
                              provider === 'groq' ? 'gsk_...' :
                                provider === 'hackclub' ? 'hc..' : ''
                      }
                      type="password"
                      className="w-full premium-input px-4 py-2.5 text-sm rounded-xl"
                    />
                  </div>
                )}

                {/* Model Selection */}
                {provider !== 'byoc' && (
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Model Selector</label>
                        <button
                          onClick={handleFetchModels}
                          disabled={fetchingModels}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                          title="Ping server & fetch installed models"
                        >
                          <ArrowsCounterClockwise size={12} className={fetchingModels ? 'animate-spin' : ''} />
                          <span>{fetchingModels ? 'Pinging...' : 'Fetch Models'}</span>
                        </button>
                      </div>

                      <button
                        onClick={() => setUseCustomModel(!useCustomModel)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${useCustomModel
                          ? 'bg-violet-600 border-violet-600 text-white shadow'
                          : 'border-[#27272a] bg-[#18181b] text-gray-500 hover:border-gray-700 hover:text-gray-300'
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
                        placeholder="e.g. qwen2.5-coder:latest"
                        type="text"
                        className="w-full premium-input px-4 py-2.5 text-sm rounded-xl"
                      />
                    ) : (
                      <select
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full premium-input px-4 py-2.5 text-sm rounded-xl"
                      >
                        {(dynamicModels.length > 0 ? dynamicModels : (MODEL_PRESETS[provider] || [])).map((m) => (
                          <option key={m} value={m} className="bg-gray-950 text-white">
                            {m}
                          </option>
                        ))}
                      </select>
                    )}

                    {fetchStatus && (
                      <div className={`rounded-lg border px-3 py-2 text-[11px] leading-relaxed mt-1 ${fetchStatus.success ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-red-500/30 bg-red-500/10 text-red-300'}`}>
                        {fetchStatus.msg}
                      </div>
                    )}
                  </div>
                )}
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
                          ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20'
                          : 'border-[#27272a] bg-[#18181b] text-gray-500 hover:border-gray-700 hover:text-gray-300'
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
                          ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20'
                          : 'border-[#27272a] bg-[#18181b] text-gray-500 hover:border-gray-700 hover:text-gray-300'
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
                          ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-900/20'
                          : 'border-[#27272a] bg-[#18181b] text-gray-500 hover:border-gray-700 hover:text-gray-300'
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

          {/* Tab 4: Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-8 animate-fade-in max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <Keyboard size={24} className="text-purple-400" />
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Master app hotkeys to speed up motion-graphics creation and navigation.
                </p>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-900">
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400">Navigation & Routing</h4>
                  <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between py-1 border-b border-gray-900/60">
                      <span className="text-xs text-gray-300 font-medium">Open Settings Page from anywhere</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Ctrl</kbd>
                        <span className="text-xs text-gray-500">+</span>
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">,</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-900/60">
                      <span className="text-xs text-gray-300 font-medium">Return to Dashboard Homepage</span>
                      <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Esc</kbd>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-300 font-medium">Exit Template Generator to Template Selector</span>
                      <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Esc</kbd>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Video Generation & Rendering</h4>
                  <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-300 font-medium">Trigger Video Generation inside any template</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Ctrl</kbd>
                        <span className="text-xs text-gray-500">+</span>
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Enter</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Tools & Inspection Overlays</h4>
                  <div className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between py-1 border-b border-gray-900/60">
                      <span className="text-xs text-gray-300 font-medium">Toggle Minecraft Primitives Global Demo Overlay</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Ctrl</kbd>
                        <span className="text-xs text-gray-500">+</span>
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Shift</kbd>
                        <span className="text-xs text-gray-500">+</span>
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">I</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-300 font-medium">Open Keyboard Shortcuts Modal</span>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">?</kbd>
                        <span className="text-xs text-gray-500">or</span>
                        <kbd className="px-2 py-1 rounded bg-gray-900 border border-gray-800 text-xs font-mono font-bold text-purple-300">Ctrl + /</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Maintenance & Danger Zone */}
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
