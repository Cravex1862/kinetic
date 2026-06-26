import React, { useState, useEffect } from 'react';
import type { ProjectData } from './AppRouter';
import { Gear, Plus, Folder, Trash, PencilSimple, FolderPlus, CaretDown } from '@phosphor-icons/react';
import logoIcon from '../../../kinetic_brand/logo_transparent.svg';
import logoWithText from '../../../kinetic_brand/logo_transparent_with_text.svg';

type Provider = 'openai' | 'anthropic' | 'google' | 'hackclub';

interface DashboardProps {
  onNewProject: () => void;
  onOpenProject: (p: ProjectData) => void;
  onDeleteProject: (p: ProjectData) => void;
  onShowFolder: (p: ProjectData) => void;
  onImportProject: () => void;
  projects: ProjectData[];
  folders: { path: string; name: string; color: string; collapsed?: boolean }[];
  onMoveProject: (projectPath: string, targetFolderPath: string | null) => void;
  onCreateFolder: (name: string, color: string) => void;
  onDeleteFolder: (folderPath: string) => void;
  onRenameFolder: (folderPath: string, newName: string) => void;
  onToggleFolderCollapse: (path: string) => void;
  onOpenSettings: () => void;
}

const FOLDER_COLORS: Record<string, { text: string; bg: string; border: string; active: string }> = {
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', active: 'bg-indigo-600' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', active: 'bg-emerald-600' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', active: 'bg-amber-600' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', active: 'bg-rose-600' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', active: 'bg-cyan-600' },
};

const Dashboard: React.FC<DashboardProps> = ({
  onNewProject,
  onOpenProject,
  onDeleteProject,
  onShowFolder,
  onImportProject,
  projects,
  folders,
  onMoveProject,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
  onToggleFolderCollapse,
  onOpenSettings,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('indigo');
  const [renameFolderTarget, setRenameFolderTarget] = useState<{ path: string; name: string } | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');

  useEffect(() => {
    const seen = localStorage.getItem('kinetic-api-key');
    if (!seen) onOpenSettings();
  }, [onOpenSettings]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-950 text-white py-12 overflow-y-auto w-full">



      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Create New Folder</h2>
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Folder Name</label>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Lower Thirds, Intros"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Folder Color</label>
                <div className="flex gap-2">
                  {Object.keys(FOLDER_COLORS).map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewFolderColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-transform ${FOLDER_COLORS[c].bg} ${FOLDER_COLORS[c].border} ${newFolderColor === c ? 'scale-110 border-white' : 'border-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    onCreateFolder(newFolderName.trim(), newFolderColor);
                    setNewFolderName('');
                    setShowCreateFolder(false);
                  }
                }}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameFolderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Rename Folder</h2>
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Name</label>
                <input
                  value={renameFolderName}
                  onChange={(e) => setRenameFolderName(e.target.value)}
                  placeholder="e.g. My Custom Folder"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setRenameFolderTarget(null)}
                className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (renameFolderName.trim() && renameFolderTarget) {
                    onRenameFolder(renameFolderTarget.path, renameFolderName.trim());
                    setRenameFolderTarget(null);
                  }
                }}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='absolute top-6 right-6'>
        <button onClick={onOpenSettings} className='flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white transition-colors' title='Config Settings'>
          <Gear size={20} />
        </button>
      </div>

      {/* Logo */}
      <div className="mb-12 flex flex-col items-center gap-3">
        <img src={logoWithText} className="h-44 object-contain" alt="kinetic" style={{ filter: 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.75)) brightness(1.2)' }} />
      </div>

      {/* Dashboard Main Content */}
      <div className="w-full px-12 mt-6 flex flex-col items-center">

        {/* Row 1: Heading and Actions button */}
        <div className="w-full flex justify-between items-center mb-6 pb-2 border-b border-gray-800/60">
          <h2 className="text-xs font-medium uppercase tracking-wider text-gray-600">Recent Projects & Folders</h2>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 hover:scale-105 shadow-lg shadow-indigo-600/30"
              title="Actions Menu"
            >
              <Plus size={20} weight="bold" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 z-50 w-56 rounded-xl border border-gray-800 bg-gray-900 p-1.5 shadow-2xl">
                <button
                  onClick={() => {
                    onNewProject();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Plus size={16} /> New Project
                </button>
                <button
                  onClick={() => {
                    setShowCreateFolder(true);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <FolderPlus size={16} /> Create Folder
                </button>
                <button
                  onClick={() => {
                    onImportProject();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Folder size={16} /> Import JSON Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Projects List container (aligned to the left) */}
        <div className="w-full flex justify-start">
          <div
            className="w-full max-w-3xl space-y-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const projectPath = e.dataTransfer.getData('projectPath');
              if (projectPath) {
                onMoveProject(projectPath, null);
              }
            }}
          >
            {projects.length > 0 ? (
              <div className="space-y-6">
                {/* Folders List */}
                <div className="space-y-4">
                  {folders.map((f, index) => {
                    const separator = f.path.includes('\\') ? '\\' : '/';
                    const folderProjects = projects.filter(p => p.savePath.startsWith(f.path + separator));
                    const colorInfo = FOLDER_COLORS[f.color] || FOLDER_COLORS.indigo;

                    return (
                      <div
                        key={index}
                        className={`rounded-lg border bg-gray-900/50 p-2 transition-colors ${colorInfo.border}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          const projectPath = e.dataTransfer.getData('projectPath');
                          if (projectPath) {
                            onMoveProject(projectPath, f.path);
                          }
                        }}
                      >
                        {/* Folder Header */}
                        <div className="flex items-center justify-between px-2 py-1.5">
                          <button
                            onClick={() => onToggleFolderCollapse(f.path)}
                            className="flex flex-1 items-center gap-2.5 text-left font-medium text-gray-300 hover:text-white"
                          >
                            <CaretDown size={14} className={`transform transition-transform ${f.collapsed ? '-rotate-90' : ''}`} />
                            <Folder size={20} className={colorInfo.text} weight="fill" />
                            <span className="text-sm font-semibold">{f.name}</span>
                            <span className="text-xs text-gray-500">({folderProjects.length})</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setRenameFolderTarget(f);
                                setRenameFolderName(f.name);
                              }}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              title="Rename Folder"
                            >
                              <PencilSimple size={15} />
                            </button>
                            <button
                              onClick={() => onDeleteFolder(f.path)}
                              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete Folder"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Folder Content */}
                        {!f.collapsed && (
                          <div className="mt-2 pl-4 space-y-2 border-l border-gray-800/80 ml-4">
                            {folderProjects.length === 0 ? (
                              <div className="py-3 text-center text-xs text-gray-600 italic">Drag projects here to group them</div>
                            ) : (
                              folderProjects.map((p, pIndex) => (
                                <div
                                  key={pIndex}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('projectPath', p.savePath);
                                  }}
                                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-4 py-2.5 hover:border-gray-700 transition-colors cursor-grab active:cursor-grabbing"
                                >
                                  <button
                                    onClick={() => onOpenProject(p)}
                                    className="flex-1 text-left text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                  >
                                    {p.title}
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => onShowFolder(p)}
                                      className="p-1 text-gray-500 hover:text-indigo-400 rounded transition-colors"
                                      title="Show in Folder"
                                    >
                                      <Folder size={16} />
                                    </button>
                                    <button
                                      onClick={() => onDeleteProject(p)}
                                      className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                                      title="Remove List Entry"
                                    >
                                      <Trash size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Root Level Projects */}
                {projects.filter(p => !folders.some(f => p.savePath.startsWith(f.path + (p.savePath.includes('\\') ? '\\' : '/')))).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600 pl-1 mt-6">Uncategorized Projects</h3>
                    {projects
                      .filter(p => !folders.some(f => p.savePath.startsWith(f.path + (p.savePath.includes('\\') ? '\\' : '/'))))
                      .map((p, i) => (
                        <div
                          key={i}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('projectPath', p.savePath);
                          }}
                          className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 hover:border-gray-700 transition-colors cursor-grab active:cursor-grabbing"
                        >
                          <button
                            onClick={() => onOpenProject(p)}
                            className="flex-1 text-left text-sm font-medium text-gray-300 hover:text-white transition-colors"
                          >
                            {p.title}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onShowFolder(p)}
                              className="p-1.5 text-gray-400 hover:bg-gray-800 hover:text-indigo-400 rounded-lg transition-colors"
                              title="Show in Folder"
                            >
                              <Folder size={18} />
                            </button>
                            <button
                              onClick={() => onDeleteProject(p)}
                              className="p-1.5 text-gray-400 hover:bg-gray-800 hover:text-red-400 rounded-lg transition-colors"
                              title="Remove List Entry"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
                <span className="text-sm text-gray-500">No recent projects generated yet.</span>
                <button
                  onClick={onNewProject}
                  className="mt-4 rounded-lg bg-indigo-600/10 border border-indigo-500/30 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/20 transition-all"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
