import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import type { SceneOutput } from '../agents/types';
import BasicGenerator from '../templates/basicAnimation/BasicGenerator';
import TemplateSelector from './TemplateSelector';
import Settings from './Settings';
import SetupWizard from './SetupWizard';
import YoutubeVideoCreator from '../templates/ytVideos/YoutubeVideoCreator';
import { LogoGenerator } from '../templates/logoAnimator/LogoGenerator';
import SaaSGenerator from '../templates/saasVideoDemo/SaaSGenerator';
import TourOverlay from '../components/TourOverlay';
import { TOUR_STEPS, MOCK_TOUR_PROJECT } from '../constants';
import { PrimitivesDemoOverlay } from '../components/PrimitivesDemoOverlay';
import { TiltConfigurer } from '../components/TiltConfigurer';
import Studio from './studio/Studio';
import { registerBYOXHandler } from '../agents/llmClient';
import { BYOCModal } from '../components/BYOCModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { AudioTesterModal } from '../components/AudioTesterModal';
import { RAGTesterModal } from '../components/RAGTesterModal';
import { PipelineTesterModal } from '../components/PipelineTesterModal';
import { VideoCompositionViewerModal } from '../components/VideoCompositionViewerModal';
import PromptSandbox from './PromptSandbox';
import { sanitizeCompositionCode } from '../agents/pipeline';

export interface ProjectData {
  id?: string;
  title: string;
  narration: string;
  prompt: string;
  savePath: string;
  scenes?: any;
  code?: string;
  showVisualizer?: boolean;
  visualizerVariant?: 'wave' | 'bars' | 'circle';
  fonts?: any;
  colors?: any;
  bgSelection?: any;
  bgDescription?: string;
  unfinished?: boolean;
  generationState?: any;
}

export interface AlertButton {
  label: string;
  value: any;
  isPrimary?: boolean;
  isDanger?: boolean;
}

export interface CustomAlertState {
  title: string;
  message: string;
  buttons: AlertButton[];
  resolve: (value: any) => void;
}

const AppRouter: React.FC = () => {
  const [alertState, setAlertState] = useState<CustomAlertState | null>(null);
  const [previousPage, setPreviousPage] = useState<'dashboard' | 'template-selector' | 'basic-generator' | 'saas-generator' | 'youtube-creator' | 'logo-generator' | 'minecraft-creator' | 'basic-studio' | 'settings' | 'setup' | 'primitives-demo'>('dashboard');

  const [showTiltConfigurer, setShowTiltConfigurer] = useState(false);
  const [showRAGTester, setShowRAGTester] = useState(false);
  const [showPipelineTester, setShowPipelineTester] = useState(false);
  const [showVideoCompositionViewer, setShowVideoCompositionViewer] = useState(false);
  const [byocPrompt, setByocPrompt] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
        e.preventDefault();
        setShowRAGTester((prev) => !prev);
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setShowPipelineTester((prev) => !prev);
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'V' || e.key === 'v')) {
        e.preventDefault();
        setShowVideoCompositionViewer((prev) => !prev);
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        setPage('prompt-sandbox');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [byocResolver, setByocResolver] = useState<{
    resolve: (val: string) => void;
    reject: (err?: any) => void;
  } | null>(null);

  useEffect(() => {
    registerBYOXHandler((promptText) => {
      return new Promise<string>((resolve, reject) => {
        setByocPrompt(promptText);
        setByocResolver({ resolve, reject });
      });
    });
    return () => registerBYOXHandler(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setPage(prev => {
          if (prev === 'primitives-demo') {
            return previousPage;
          } else {
            setPreviousPage(prev);
            return 'primitives-demo';
          }
        });
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setShowTiltConfigurer(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previousPage]);



  const customAlert = (title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        title,
        message,
        buttons: [{ label: 'Ok', value: true, isPrimary: true }],
        resolve: () => {
          setAlertState(null);
          resolve();
        }
      });
    });
  };

  const customConfirm = (
    title: string,
    message: string,
    buttons?: AlertButton[]
  ): Promise<any> => {
    return new Promise((resolve) => {
      setAlertState({
        title,
        message,
        buttons: buttons || [
          { label: 'Cancel', value: false },
          { label: 'Ok', value: true, isPrimary: true }
        ],
        resolve: (val) => {
          setAlertState(null);
          resolve(val);
        }
      });
    });
  };

  const [page, setPage] = useState<'dashboard' | 'template-selector' | 'basic-generator' | 'saas-generator' | 'youtube-creator' | 'logo-generator' | 'minecraft-creator' | 'basic-studio' | 'settings' | 'setup' | 'primitives-demo' | 'prompt-sandbox'>(() => {
    const completed = localStorage.getItem('kinetic-setup-completed') === 'true';
    return completed ? 'dashboard' : 'setup';
  });
  const [project, setProject] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [workspaceDir, setWorkSpaceDir] = useState<string>(localStorage.getItem('kinetic-workspace-dir') || '');
  const [folders, setFolders] = useState<{ path: string; name: string; color: string; collapsed?: boolean }[]>(() => {
    const saved = localStorage.getItem('kinetic-folders');
    return saved ? JSON.parse(saved) : [];
  });

  // Tour state
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const startTour = () => {
    setTourStep(0);
    setTourActive(true);
    setPage('dashboard');
  };

  const handleTourNext = () => {
    const nextStep = tourStep + 1;
    if (nextStep >= TOUR_STEPS.length) {
      // Tour complete
      setTourActive(false);
      setTourStep(0);
      return;
    }
    // Navigate to correct page for next step
    if (nextStep === 1) {
      // Moving to template selector step — trigger New Project
      handleNewProject();
    } else if (nextStep === 2) {
      // Moving to prompt step — select Basic Animation template automatically
      handleSelectTemplate('basic-animation', workspaceDir);
    } else if (nextStep === 4) {
      // Moving to result step — load mockup project instantly for preview
      handleGenerate(MOCK_TOUR_PROJECT as ProjectData);
    }
    setTourStep(nextStep);
  };

  const handleTourSkip = () => {
    setTourActive(false);
    setTourStep(0);
  };

  const handleSelectTemplate = async (templateKey: string, selectedDir: string) => {
    const newProject: ProjectData = {
      title: 'Draft Project',
      prompt: '',
      narration: '',
      savePath: '', // In-memory draft (only saved to disk upon first generation run)
      scenes: [],
      unfinished: true
    };

    setProject(newProject);

    if (templateKey === 'youtube-videos') {
      setPage('youtube-creator');
    } else if (templateKey === 'logo-animator') {
      setPage('logo-generator');
    } else if (templateKey === 'minecraft-style') {
      setPage('minecraft-creator');
    } else if (templateKey === 'saas-demo-videos' || templateKey === 'ui-ux-walkthrough') {
      setPage('saas-generator');
    } else {
      setPage('basic-generator');
    }

    if (tourActive && tourStep === 1) {
      setTourStep(2);
    }
  };

  React.useEffect(() => {
    localStorage.setItem('kinetic-folders', JSON.stringify(folders));
  }, [folders]);



  React.useEffect(() => {
    const loadProjects = async () => {
      if (!window.electronAPI) return;
      try {
        const savedPaths = localStorage.getItem('kinetic-project-paths');
        const paths: string[] = savedPaths ? JSON.parse(savedPaths) : [];
        const loadedProjects: ProjectData[] = [];
        const validPaths: string[] = [];

        for (const filePath of paths) {
          const content = await window.electronAPI.readFile(filePath);
          if (content) {
            try {
              const parsed = JSON.parse(content);
              parsed.savePath = filePath;
              loadedProjects.push(parsed);
              validPaths.push(filePath);
            } catch (err) {
              console.error(`Failed to parse project file ${filePath}`, err);
            }
          }
        }
        setProjects(loadedProjects);
        localStorage.setItem('kinetic-project-paths', JSON.stringify(validPaths));
      } catch (e) {
        console.error(`Failed to load project files:`, e);
      }
    };
    loadProjects();
  }, []);

  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  React.useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Ctrl + , or Cmd + , -> Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setPage('settings');
        return;
      }

      // Toggle Keyboard Shortcuts Modal on ? or Ctrl + / (ignore when typing in input/textarea)
      if (!isInput && (e.key === '?' || (e.key === '/' && (e.ctrlKey || e.metaKey)))) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  React.useEffect(() => {
    const paths = projects.map((p) => p.savePath).filter(Boolean) as string[];
    localStorage.setItem('kinetic-project-paths', JSON.stringify(paths));
  }, [projects]);

  const handleNewProject = async () => {
    setPage('template-selector');
    if (tourActive && tourStep === 0) {
      setTourStep(1);
    }
  };

  const handleGenerate = async (data: ProjectData) => {
    let finalProject = { ...data };

    // If this is an un-saved draft project, generate a savePath and create the file on disk now!
    if (!finalProject.savePath) {
      let finalDir: string | null = workspaceDir;
      if (!finalDir && window.electronAPI?.selectDirectory) {
        finalDir = await window.electronAPI.selectDirectory();
      }
      if (finalDir) {
        const files = await window.electronAPI?.readDirectory(finalDir);
        let n = 1;
        while (files?.includes(`untitled_${n}.json`)) {
          n++;
        }
        const filename = `untitled_${n}.json`;
        const separator = finalDir.includes('\\') ? '\\' : '/';
        const savePath = `${finalDir}${separator}${filename}`;

        finalProject.savePath = savePath;
        if (!finalProject.title || finalProject.title === 'Draft Project') {
          finalProject.title = `untitled_${n}`;
        }
      }
    }

    if (finalProject.savePath && window.electronAPI?.writeFile) {
      try {
        await window.electronAPI.writeFile(finalProject.savePath, JSON.stringify(finalProject, null, 2));
      } catch (e) {
        console.warn('[AppRouter] Save project failed:', e);
      }
    }
    if (finalProject.code && window.electronAPI?.writeFile) {
      try {
        const sanitized = sanitizeCompositionCode(finalProject.code);
        if (sanitized) {
          await window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', sanitized);
        }
      } catch (e) {
        console.warn('[AppRouter] Write composition failed:', e);
      }
    }

    setProject(finalProject);
    setProjects((prev) => {
      const exists = prev.some((p) => p.savePath === finalProject.savePath);
      if (exists) {
        return prev.map((p) => (p.savePath === finalProject.savePath ? finalProject : p));
      }
      return [...prev, finalProject];
    });

    setPage('basic-studio');
    if (tourActive) {
      setTourStep(4);
    }
  };

  const handleImportProject = async () => {
    if (!window.electronAPI?.selectFile) {
      await customAlert("Feature Unavailable", "Importing files is only supported inside the desktop app");
      return;
    }


    const filePath = await window.electronAPI.selectFile();
    if (!filePath) return;

    const content = await window.electronAPI.readFile(filePath);
    if (!content) {
      await customAlert("File Error", "Failed to read file");
      return;
    }
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed !== 'object' || !parsed.title) {
        await customAlert("Invalid Format", "Invalid project format.");
        return;
      }
      parsed.savePath = filePath;
      if (projects.some((p) => p.savePath === filePath)) {
        await customAlert("Project Import", "Project already imported");
        return;
      }
      setProjects((prev) => [...prev, parsed]);
    }
    catch {
      await customAlert("File Error", "Invalid JSON file");
    }
  };

  const handleDeletProject = async (pToDelete: ProjectData) => {
    const confirmDelete = await customConfirm(
      "Delete Project",
      `Are you sure you want to permanently delete ${pToDelete.title} from your computer? This cannot be undone.`,
      [
        { label: 'Cancel', value: false },
        { label: 'Delete', value: true, isPrimary: true, isDanger: true }
      ]
    );
    if (confirmDelete) {
      if (window.electronAPI?.deleteFile && pToDelete.savePath) {
        const deleted = await window.electronAPI.deleteFile(pToDelete.savePath);
        if (!deleted) {
          const content = await window.electronAPI.readFile(pToDelete.savePath);
          if (content) {
            await customAlert("Delete Error", "Failed to delete the file from your computer. Please check folder permissions.");
            return;
          }
        }
      }
      setProjects((prev) => prev.filter((p) => p.savePath !== pToDelete.savePath));
    }
  };

  const handleShowFolder = async (p: ProjectData) => {
    if (p.savePath && window.electronAPI?.showItemInFolder) {
      await window.electronAPI.showItemInFolder(p.savePath);
    }
  }

  const handleCreateFolder = async (name: string, color: string) => {
    try {
      let currentWorkspace = workspaceDir;
      if (!currentWorkspace) {
        if (!window.electronAPI?.selectDirectory) {
          // No electron API fallback
          const folderPath = `virtual://${name}`;
          setFolders(prev => [...(Array.isArray(prev) ? prev : []), { path: folderPath, name, color, collapsed: false }]);
          return;
        }
        const selected = await window.electronAPI.selectDirectory();
        if (!selected) return;
        currentWorkspace = selected;
        setWorkSpaceDir(selected);
        localStorage.setItem('kinetic-workspace-dir', selected);
      }

      const seperator = currentWorkspace.includes('\\') ? '\\' : '/';
      const folderPath = `${currentWorkspace}${seperator}${name}`;

      if (window.electronAPI?.createDirectory) {
        const ok = await window.electronAPI.createDirectory(folderPath);
        if (ok) {
          setFolders(prev => [...(Array.isArray(prev) ? prev : []), { path: folderPath, name, color, collapsed: false }]);
        }
        else {
          await customAlert("Folder Error", "Failed to create the physical folder");
        }
      }
      else {
        // Safe fallback for web preview
        setFolders(prev => [...(Array.isArray(prev) ? prev : []), { path: folderPath, name, color, collapsed: false }]);
      }
    }
    catch (err: any) {
      console.error('Folder creation failed:', err);
      await customAlert("Folder Creation Error", err.message || String(err));
    }
  };

  const handleMoveProject = async (projectPath: string, targetFolderPath: string | null) => {
    if (!window.electronAPI?.moveFile) return;

    const separator = projectPath.includes('\\') ? '\\' : '/';
    const parts = projectPath.split(separator);
    const filename = parts[parts.length - 1];

    let newPath = '';
    if (targetFolderPath === null) {
      if (!workspaceDir) return;
      newPath = `${workspaceDir}${separator}${filename}`;
    }
    else {
      newPath = `${targetFolderPath}${separator}${filename}`;
    }

    if (newPath === projectPath) return;

    const ok = await window.electronAPI.moveFile(projectPath, newPath);
    if (ok) {
      setProjects(prev => prev.map(p => {
        if (p.savePath === projectPath) {
          const updated = { ...p, savePath: newPath };
          if (window.electronAPI?.writeFile) {
            window.electronAPI.writeFile(newPath, JSON.stringify(updated, null, 2));
          }
          return updated;
        }
        return p;
      }));
    }
    else {
      await customAlert("File Move Error", "Failed to move project file");
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    const separator = folderPath.includes('\\') ? '\\' : '/';
    const folderProjects = projects.filter(p => p.savePath.startsWith(folderPath + separator));

    let action: 'move' | 'delete' | 'cancel' = 'move';
    if (folderProjects.length > 0) {
      const choice = await customConfirm(
        "Delete Folder",
        `This folder contains ${folderProjects.length} projects. What would you like to do with them?`,
        [
          { label: 'Cancel', value: 'cancel' },
          { label: 'Delete Permanently', value: 'delete', isDanger: true },
          { label: 'Move to Root', value: 'move', isPrimary: true }
        ]
      );
      if (!choice || choice === 'cancel') return;
      action = choice;
    }

    if (action === 'move') {
      for (const p of folderProjects) {
        await handleMoveProject(p.savePath, null);
      }
    }
    else if (action === 'delete') {
      if (window.electronAPI?.deleteFile) {
        for (const p of folderProjects) {
          await window.electronAPI.deleteFile(p.savePath);
        }
        setProjects(prev => prev.filter(p => !folderProjects.some(fp => fp.savePath === p.savePath)));
      }
    }

    if (window.electronAPI?.deleteDirectory) {
      await window.electronAPI.deleteDirectory(folderPath);
    }

    setFolders(prev => prev.filter(f => f.path !== folderPath));
  };

  const handleRenameFolder = async (folderPath: string, newName: string) => {
    if (!window.electronAPI?.moveFile) return;

    const separator = folderPath.includes('\\') ? '\\' : '/';
    const parts = folderPath.split(separator);
    parts[parts.length - 1] = newName;

    const newPath = parts.join(separator);

    if (newPath == folderPath) return;

    const ok = await window.electronAPI.moveFile(folderPath, newPath);
    if (ok) {
      setProjects(prev => prev.map(p => {
        if (p.savePath.startsWith(folderPath + separator)) {
          const relative = p.savePath.slice(folderPath.length);
          const updatedPath = newPath + relative;
          const updated = { ...p, savePath: updatedPath };
          if (window.electronAPI?.writeFile) {
            window.electronAPI.writeFile(updatedPath, JSON.stringify(updated, null, 2));
          }
          return updated;
        }
        return p;
      }))

      setFolders(prev => prev.map(f => {
        if (f.path === folderPath) {
          return {
            ...f, path: newPath, name: newName
          }
        }
        return f;
      }));
    }
    else {
      await customAlert("Rename Error", "Failed to rename physical folder");
    }
  };

  return (
    <div className='h-screen w-full bg-gray-950 font-sans text-white selection:bg-purple-600/30'>
      {page === 'dashboard' && (
        <Dashboard
          onNewProject={handleNewProject}
          onOpenProject={async (p) => {
            let projectToOpen = p;
            if (p.savePath && window.electronAPI?.readFile) {
              const freshContent = await window.electronAPI.readFile(p.savePath);
              if (freshContent) {
                try {
                  const parsed = JSON.parse(freshContent);
                  parsed.savePath = p.savePath;
                  projectToOpen = parsed;
                } catch (e) {
                  console.error("Failed to parse project file on open:", e);
                }
              }
            }
            if (projectToOpen.code && window.electronAPI?.writeFile) {
              const cleanCode = sanitizeCompositionCode(projectToOpen.code);
              if (cleanCode) {
                await window.electronAPI.writeFile('src/renderer/scenes/VideoComposition.tsx', cleanCode);
              }
            }
            setProject(projectToOpen);
            if (projectToOpen.unfinished) {
              setPage('basic-generator');
            } else {
              setPage('basic-studio');
            }
          }}
          onDeleteProject={handleDeletProject}
          onShowFolder={handleShowFolder}
          onImportProject={handleImportProject}
          projects={projects}
          folders={folders}
          onMoveProject={handleMoveProject}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFolder={handleRenameFolder}
          onToggleFolderCollapse={(path: string) => {
            setFolders(prev => prev.map(f => f.path === path ? { ...f, collapsed: !f.collapsed } : f));
          }}
          onOpenSettings={() => setPage('settings')}
        />
      )}
      {page === 'template-selector' && (
        <TemplateSelector
          onBack={() => setPage('dashboard')}
          initialDirectory={workspaceDir}
          onSelectDirectory={(dir: string) => {
            setWorkSpaceDir(dir);
            localStorage.setItem('kinetic-workspace-dir', dir);
          }}
          onSelect={handleSelectTemplate}
        />
      )}
      {page === 'basic-generator' && (
        <BasicGenerator
          project={project}
          onGenerate={handleGenerate}
          onBack={(updatedProject) => {
            if (updatedProject) {
              setProject(updatedProject);
              setProjects((prev) =>
                prev.map((p) => (p.savePath === updatedProject.savePath ? updatedProject : p))
              );
              if (updatedProject.savePath && window.electronAPI?.writeFile) {
                window.electronAPI.writeFile(updatedProject.savePath, JSON.stringify(updatedProject, null, 2));
              }
            }
            setPage('template-selector');
          }}
          onUpdateProject={(updated) => {
            setProject(updated);
            setProjects((prev) =>
              prev.map((p) => (p.savePath === updated.savePath ? updated : p))
            );
          }}
          customAlert={customAlert}
          customConfirm={customConfirm}
          tourActive={tourActive}
          tourStep={tourStep}
        />
      )}
      {page === 'youtube-creator' && (
        <YoutubeVideoCreator
          onBack={() => setPage('template-selector')}
        />
      )}
      {page === 'saas-generator' && (
        <SaaSGenerator
          project={project}
          onGenerate={handleGenerate}
          onBack={(updatedProject) => {
            if (updatedProject) {
              setProject(updatedProject);
              setProjects((prev) =>
                prev.map((p) => (p.savePath === updatedProject.savePath ? updatedProject : p))
              );
              if (updatedProject.savePath && window.electronAPI?.writeFile) {
                window.electronAPI.writeFile(updatedProject.savePath, JSON.stringify(updatedProject, null, 2));
              }
            }
            setPage('template-selector');
          }}
          onUpdateProject={(updated) => {
            setProject(updated);
            setProjects((prev) =>
              prev.map((p) => (p.savePath === updated.savePath ? updated : p))
            );
          }}
          customAlert={customAlert}
          customConfirm={customConfirm}
        />
      )}
      {page === 'logo-generator' && (
        <LogoGenerator
          project={project}
          onGenerate={handleGenerate}
          onBack={(updatedProject) => {
            if (updatedProject) {
              setProject(updatedProject);
              setProjects((prev) =>
                prev.map((p) => (p.savePath === updatedProject.savePath ? updatedProject : p))
              );
              if (updatedProject.savePath && window.electronAPI?.writeFile) {
                window.electronAPI.writeFile(updatedProject.savePath, JSON.stringify(updatedProject, null, 2));
              }
            }
            setPage('template-selector');
          }}
          onUpdateProject={(updated) => {
            setProject(updated);
            setProjects((prev) =>
              prev.map((p) => (p.savePath === updated.savePath ? updated : p))
            );
          }}
          customAlert={customAlert}
          customConfirm={customConfirm}
        />
      )}
      {page === 'basic-studio' && project && (
        <Studio
          project={project}
          onBack={() => setPage('dashboard')}
          onUpdateProject={async (updated) => {
            setProject(updated);
            setProjects((prev) =>
              prev.map((p) => (p.savePath === updated.savePath ? updated : p))
            );
            if (updated.savePath && window.electronAPI?.writeFile) {
              await window.electronAPI.writeFile(updated.savePath, JSON.stringify(updated, null, 2));
            }
          }}
          onRename={async (newTitle) => {
            const updated = { ...project, title: newTitle };
            setProject(updated);
            setProjects((prev) =>
              prev.map((p) => (p.savePath === project.savePath ? updated : p))
            );
            if (project.savePath && window.electronAPI?.writeFile) {
              await window.electronAPI.writeFile(project.savePath, JSON.stringify(updated, null, 2));
            }
          }}
          customAlert={customAlert}
        />
      )}
      {page === 'settings' && (
        <Settings
          onBack={() => setPage('dashboard')}
          customAlert={customAlert}
          customConfirm={customConfirm}
        />
      )}
      {page === 'prompt-sandbox' && (
        <PromptSandbox />
      )}
      {page === 'setup' && (
        <SetupWizard
          onComplete={() => {
            setPage('dashboard');
            startTour();
          }}
          customAlert={customAlert}
        />
      )}
      {/* Product Tour Overlay */}
      {tourActive && (
        <TourOverlay
          steps={TOUR_STEPS}
          currentStep={tourStep}
          onNext={handleTourNext}
          onSkip={handleTourSkip}
        />
      )}
      {alertState && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl border border-gray-800 bg-gray-900/95 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="mb-3 text-lg font-bold tracking-wide text-white">
              {alertState.title}
            </h3>
            <div className="mb-5 rounded-xl border border-gray-800/80 bg-gray-950/60 p-4 text-sm text-gray-400 min-h-[90px] flex items-center leading-relaxed">
              {alertState.message}
            </div>
            <div className="flex justify-end gap-3">
              {alertState.buttons.map((btn, index) => {
                const isCancel = btn.label.toLowerCase() === 'cancel';
                return (
                  <button
                    key={index}
                    onClick={() => alertState.resolve(btn.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${isCancel
                      ? 'border border-gray-700 bg-gray-900/50 hover:bg-gray-800 text-gray-400 hover:text-white'
                      : btn.isDanger
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {page === 'primitives-demo' && (
        <PrimitivesDemoOverlay onClose={() => setPage(previousPage)} />
      )}

      {showRAGTester && (
        <RAGTesterModal onClose={() => setShowRAGTester(false)} />
      )}
      {showPipelineTester && (
        <PipelineTesterModal onClose={() => setShowPipelineTester(false)} />
      )}
      {showVideoCompositionViewer && (
        <VideoCompositionViewerModal onClose={() => setShowVideoCompositionViewer(false)} />
      )}
      {showTiltConfigurer && (
        <TiltConfigurer
          onClose={() => setShowTiltConfigurer(false)}
          customAlert={customAlert}
        />
      )}
      {byocPrompt && (
        <BYOCModal
          promptText={byocPrompt}
          onSubmit={(response) => {
            byocResolver?.resolve(response);
            setByocPrompt(null);
            setByocResolver(null);
          }}
          onCancel={() => {
            byocResolver?.reject(new Error('User cancelled BYOC prompt'));
            setByocPrompt(null);
            setByocResolver(null);
          }}
          onSkip={() => {
            byocResolver?.resolve('SKIP');
            setByocPrompt(null);
            setByocResolver(null);
          }}
        />
      )}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
      <AudioTesterModal />
    </div>
  );
};

export default AppRouter;
