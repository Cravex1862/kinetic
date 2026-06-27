import React, { useState, useRef, useEffect } from 'react';
import type { ProjectData } from './AppRouter';
import { Gear, Plus, Folder, Trash, PencilSimple, FolderPlus, CaretDown, MagnifyingGlass, X, FilmSlate, ArrowRight } from '@phosphor-icons/react';
import logoWithText from '../../../kinetic_brand/logo_transparent_with_text.png';

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
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', active: 'bg-purple-600' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', active: 'bg-emerald-600' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', active: 'bg-amber-600' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', active: 'bg-rose-600' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', active: 'bg-cyan-600' },
};

const SOLID_COLORS: Record<string, string> = {
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
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
  const [newFolderColor, setNewFolderColor] = useState('purple');
  const [renameFolderTarget, setRenameFolderTarget] = useState<{ path: string; name: string } | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-950 text-white py-12 overflow-y-auto w-full page-enter">

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-8 shadow-2xl shadow-purple-500/5">
            <h2 className="text-xl font-bold text-white tracking-wide">Create New Folder</h2>
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folder Name</label>
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      onCreateFolder(newFolderName.trim(), newFolderColor);
                      setNewFolderName('');
                      setShowCreateFolder(false);
                    }
                  }}
                  placeholder="e.g. SaaS Walkthroughs, Demos"
                  autoFocus
                  className="w-full premium-input px-4 py-2.5 text-sm rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Folder Color</label>
                <div className="flex gap-2.5 pt-1">
                  {Object.keys(FOLDER_COLORS).map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewFolderColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${SOLID_COLORS[c]} ${newFolderColor === c ? 'scale-110 border-white ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
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
                className="flex-1 premium-button-secondary py-2.5 text-sm rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newFolderName.trim()) {
                    try {
                      await onCreateFolder(newFolderName.trim(), newFolderColor);
                    } catch (err) {
                      console.error("Failed to trigger folder creation:", err);
                    } finally {
                      setNewFolderName('');
                      setShowCreateFolder(false);
                    }
                  }
                }}
                className="flex-1 premium-button-primary py-2.5 text-sm font-semibold rounded-lg animate-pulse-subtle"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameFolderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-8 shadow-2xl shadow-purple-500/5">
            <h2 className="text-xl font-bold text-white tracking-wide">Rename Folder</h2>
            <div className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">New Name</label>
                <input
                value={renameFolderName}
                  onChange={(e) => setRenameFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && renameFolderName.trim() && renameFolderTarget) {
                      onRenameFolder(renameFolderTarget.path, renameFolderName.trim());
                      setRenameFolderTarget(null);
                    }
                  }}
                  placeholder={renameFolderTarget?.name || 'New folder name...'}
                  autoFocus
                  className="w-full premium-input px-4 py-2.5 text-sm rounded-lg"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setRenameFolderTarget(null)}
                className="flex-1 premium-button-secondary py-2.5 text-sm rounded-lg"
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
                className="flex-1 premium-button-primary py-2.5 text-sm font-semibold rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings CTA Gear */}
      <div className="absolute top-6 right-6">
        <button
          onClick={onOpenSettings}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:border-purple-500/40 hover:text-purple-400 transition-all hover:scale-105"
          title="Config Settings"
        >
          <Gear size={20} />
        </button>
      </div>

      {/* Brand Logo Header */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <img
          src={logoWithText}
          className="h-28 object-contain"
          alt="kinetic"
          style={{ filter: 'drop-shadow(0 0 25px rgba(139, 92, 246, 0.45)) brightness(1.15)' }}
        />
      </div>

      {/* Dashboard Main Content */}
      <div className="w-full mt-6 flex flex-col items-center">

        {/* Row 1: Heading and Actions */}
        <div className="w-full flex justify-between items-center mb-6 pb-2 border-b border-gray-800/60 max-w-3xl">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent Projects & Folders</h2>

          <div className="flex items-center gap-2" ref={menuRef}>
            {/* Secondary: Create Folder */}
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-800 text-gray-400 hover:border-purple-500/40 hover:text-purple-400 transition-all hover:scale-105"
              title="Create Folder"
              aria-label="Create Folder"
            >
              <FolderPlus size={17} />
            </button>

            {/* Secondary: Import */}
            <button
              onClick={onImportProject}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-800 text-gray-400 hover:border-purple-500/40 hover:text-purple-400 transition-all hover:scale-105"
              title="Import JSON Project"
              aria-label="Import JSON Project"
            >
              <Folder size={17} />
            </button>

            {/* Primary: New Project */}
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl premium-button-primary shadow-lg shadow-purple-600/10 text-sm font-semibold"
              aria-label="New Project"
            >
              <Plus size={16} weight="bold" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Search Bar for Projects */}
        {projects.length > 0 && (
          <div className="w-full max-w-3xl mb-6 relative">
            <div className={`absolute inset-y-0 left-3.5 flex items-center pointer-events-none transition-colors ${searchFocused || searchQuery ? 'text-purple-400' : 'text-gray-500'}`}>
              <MagnifyingGlass size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search projects..."
              className="w-full premium-input pl-10 pr-10 py-2.5 text-sm rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Row 2: Projects List container */}
        <div className="w-full flex justify-center">
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
                {(() => {
                  const displayedFolders = folders.filter(f => {
                    const separator = f.path.includes('\\') ? '\\' : '/';
                    const folderProjects = projects.filter(p => p.savePath.startsWith(f.path + separator));
                    const matchingProjects = folderProjects.filter(p =>
                      p.title.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    const folderNameMatches = f.name.toLowerCase().includes(searchQuery.toLowerCase());
                    return folderNameMatches || matchingProjects.length > 0;
                  });

                  const rootProjects = projects.filter(p => !folders.some(f => p.savePath.startsWith(f.path + (p.savePath.includes('\\') ? '\\' : '/'))));
                  const displayedRootProjects = rootProjects.filter(p =>
                    p.title.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  const hasAnyMatches = displayedFolders.length > 0 || displayedRootProjects.length > 0;

                  return (
                    <>
                      {/* Folders list */}
                      {displayedFolders.length > 0 && (
                        <div className="space-y-4">
                          {displayedFolders.map((f, index) => {
                            const separator = f.path.includes('\\') ? '\\' : '/';
                            const folderProjects = projects.filter(p => p.savePath.startsWith(f.path + separator));
                            const displayedFolderProjects = folderProjects.filter(p =>
                              p.title.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                            const colorInfo = FOLDER_COLORS[f.color] || FOLDER_COLORS.purple;

                            return (
                              <div
                                key={index}
                                className={`rounded-xl border bg-gray-900/10 p-3 transition-colors ${colorInfo.border} hover:border-purple-500/30`}
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
                                    aria-label={`Toggle folder ${f.name}`}
                                  >
                                    <CaretDown size={14} className={`transform transition-transform duration-200 ${f.collapsed ? '-rotate-90' : ''}`} />
                                    <Folder size={20} className={colorInfo.text} weight="fill" />
                                    <span className="text-sm font-semibold">{f.name}</span>
                                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-gray-800 text-[10px] font-semibold text-gray-400">{displayedFolderProjects.length}</span>
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setRenameFolderTarget(f);
                                        setRenameFolderName(f.name);
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                                      title="Rename Folder"
                                    >
                                      <PencilSimple size={15} />
                                    </button>
                                    <button
                                      onClick={() => onDeleteFolder(f.path)}
                                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                                      title="Delete Folder"
                                    >
                                      <Trash size={15} />
                                    </button>
                                  </div>
                                </div>

                                {/* Folder Content list */}
                                {!f.collapsed && (
                                  <div className="mt-2 pl-4 space-y-2 border-l border-gray-800/80 ml-4">
                                    {displayedFolderProjects.length === 0 ? (
                                      <div className="py-4 text-center text-xs text-gray-600 italic">Drag projects here to group them</div>
                                    ) : (
                                      displayedFolderProjects.map((p, pIndex) => (
                                        <div
                                          key={pIndex}
                                          draggable
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('projectPath', p.savePath);
                                          }}
                                          className="flex items-center justify-between premium-card px-4 py-2.5 cursor-pointer rounded-lg group"
                                        >
                                          <button
                                            onClick={() => onOpenProject(p)}
                                            className="flex-1 text-left text-sm font-semibold text-gray-300 hover:text-purple-400 transition-colors truncate max-w-xs"
                                          >
                                            {p.title}
                                          </button>
                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                              onClick={() => onShowFolder(p)}
                                              className="p-2 text-gray-500 hover:text-purple-400 rounded-lg transition-colors"
                                              title="Show in Folder"
                                              aria-label="Show in Folder"
                                            >
                                              <Folder size={15} />
                                            </button>
                                            <button
                                              onClick={() => onDeleteProject(p)}
                                              className="p-2 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                                              title="Delete Project"
                                              aria-label="Delete Project"
                                            >
                                              <Trash size={15} />
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
                      )}

                      {/* Root Level Projects */}
                      {displayedRootProjects.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 mt-6 mb-3">
                            <div className="flex-1 border-t border-gray-800/60" />
                            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">Uncategorized</h3>
                            <div className="flex-1 border-t border-gray-800/60" />
                          </div>
                          {displayedRootProjects.map((p, i) => (
                            <div
                              key={i}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('projectPath', p.savePath);
                              }}
                              className="flex items-center justify-between premium-card px-4 py-3 cursor-pointer rounded-xl group"
                            >
                              <button
                                onClick={() => onOpenProject(p)}
                                className="flex-1 text-left text-sm font-semibold text-gray-300 hover:text-purple-400 transition-colors truncate max-w-sm"
                              >
                                {p.title}
                              </button>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => onShowFolder(p)}
                                  className="p-2 text-gray-400 hover:text-purple-400 rounded-lg transition-colors"
                                  title="Show in Folder"
                                  aria-label="Show in Folder"
                                >
                                  <Folder size={16} />
                                </button>
                                <button
                                  onClick={() => onDeleteProject(p)}
                                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                                  title="Delete Project"
                                  aria-label="Delete Project"
                                >
                                  <Trash size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {!hasAnyMatches && (
                        <div className="flex flex-col items-center justify-center py-14 border border-dashed border-gray-800 rounded-2xl bg-gray-950/30 w-full">
                          <MagnifyingGlass size={28} className="text-gray-700 mb-3" />
                          <span className="text-sm font-semibold text-gray-400">No results for "{searchQuery}"</span>
                          <button onClick={() => setSearchQuery('')} className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors">Clear search</button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-800/60 rounded-2xl bg-gray-950/20 w-full">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/10 border border-purple-500/20 mb-5">
                  <FilmSlate size={28} className="text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No projects yet</h3>
                <p className="text-xs text-gray-500 text-center max-w-xs leading-relaxed mb-6">Kinetic generates After Effects-style motion graphics videos from code. Create your first project to get started.</p>
                <button
                  onClick={onNewProject}
                  className="flex items-center gap-2 rounded-xl premium-button-primary px-5 py-2.5 text-sm font-semibold shadow-lg shadow-purple-600/15"
                >
                  <Plus size={15} weight="bold" />
                  <span>Create your first project</span>
                  <ArrowRight size={14} />
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
