import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import type { SceneOutput } from '../agents/types';
import BasicGenerator from '../templates/basicAnimation/BasicGenerator';
import BasicStudio from '../templates/basicAnimation/BasicStudio';
import TemplateSelector from './TemplateSelector';
import Settings from './Settings';
import SetupWizard from './SetupWizard';
import YoutubeVideoCreator from '../templates/ytVideos/YoutubeVideoCreator';
import TourOverlay from '../components/TourOverlay';
import { TOUR_STEPS, MOCK_TOUR_PROJECT } from '../constants';

export interface ProjectData {
  id?: string;
  title: string;
  narration: string;
  prompt: string;
  savePath: string;
  scenes?: SceneOutput[];
  showVisualizer?: boolean;
  visualizerVariant?: 'wave' | 'bars' | 'circle';
  fonts?: any;
  colors?: any;
  bgDescription?: string;
  unfinished?: boolean;
  generationState?: {
    scenes: any[];
    componentTrees: any[];
    animationPlans: any[];
    copies: any[];
  };
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

  const [page, setPage] = useState<'dashboard' | 'template-selector' | 'basic-generator' | 'youtube-creator' | 'basic-studio' | 'settings' | 'setup'>(() => {
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
    if (templateKey !== 'basic-animation' && templateKey !== 'youtube-videos') {
      await customAlert("Coming Soon", `${templateKey} template is coming soon!`);
      return;
    }
    let finalDir: string | null = selectedDir || workspaceDir;
    if (!finalDir) {
      if (!window.electronAPI?.selectDirectory) {
        await customAlert("Feature Unavailable", "Please select a directory inside the desktop app.");
        return;
      }
      finalDir = await window.electronAPI.selectDirectory();
      if (!finalDir) return;
    }

    const files = await window.electronAPI?.readDirectory(finalDir);
    let n = 1;
    while (files?.includes(`untitled_${n}.json`)) {
      n++;
    }

    const filename = `untitled_${n}.json`;
    const separator = finalDir.includes('\\') ? '\\' : '/';
    const savePath = `${finalDir}${separator}${filename}`;

    const newProject: ProjectData = {
      title: `untitled_${n}`,
      prompt: '',
      narration: '',
      savePath,
      scenes: [],
      unfinished: true
    };

    if (window.electronAPI?.writeFile) {
      await window.electronAPI.writeFile(savePath, JSON.stringify(newProject, null, 2));
    }
    setProject(newProject);
    setProjects((prev) => [...prev, newProject]);
    
    if (templateKey === 'youtube-videos') {
      setPage('youtube-creator');
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

  const handleGenerate = (data: ProjectData) => {
    setProject(data);
    setProjects((prev) =>
      prev.map((p) => (p.savePath === data.savePath ? data : p))
    );
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
          onOpenProject={(p) => {
            setProject(p);
            if (p.unfinished || !p.scenes || p.scenes.length === 0) {
              setPage('basic-generator');
            }
            else {
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
            setPage('dashboard');
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
      {page === 'basic-studio' && project && (
        <BasicStudio
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
          customConfirm={customConfirm}
        />
      )}
      {page === 'settings' && (
        <Settings
          onBack={() => setPage('dashboard')}
          customAlert={customAlert}
          customConfirm={customConfirm}
        />
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
    </div>
  );
};

export default AppRouter;
