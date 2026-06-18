import React, { useState } from 'react';
import Dashboard from './Dashboard';
import TemplateSelector from './TemplateSelector';
import type { SceneOutput } from '../agents/types';
import BasicGenerator from '../templates/basicAnimation/BasicGenerator';
import BasicStudio from '../templates/basicAnimation/BasicStudio';




export interface ProjectData {
  title: string;
  narration: string;
  prompt: string;
  scenes?: SceneOutput[];
  showVisualizer?: boolean;
}


const AppRouter: React.FC = () => {
  const [page, setPage] = useState<'dashboard' | 'template-selector' | 'basic-generator' | 'basic-studio'>('dashboard');
  const [project, setProject] = useState<ProjectData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>(() => {
  const saved = localStorage.getItem('kinetic-projects');
  const list = saved ? JSON.parse(saved) : [];
  const unfinished = localStorage.getItem('kinetic-unifinished-projects');
  if(unfinished) {
    const parseUnfinished = JSON.parse(unfinished);
    if(!list.some((p :any) => p.title === parseUnfinished.title && p.narration === parseUnfinished.narration)){
      list.push(parseUnfinished);
    }
  }
  return list;
});

React.useEffect(() => {
  localStorage.setItem('kinetic-projects', JSON.stringify(projects));

}, [projects]);

  const handleTemplateSelect = (template: string): void => {
    if (template === 'basic-animation') {
      setPage('basic-generator');
    }
  };

  const handleGenerate = (data: ProjectData) => {
    setProjects((prev) => [...prev, data]);
    setProject(data);
    setPage('basic-studio');
  };
  return (
    <div className='h-screen w-full bg-gray-950 font-sans text-white selection:bg-indigo-500/30'>
      {page === 'dashboard' && (
        <Dashboard
          onNewProject={() => setPage('template-selector')}
          onOpenProject={(p) => {
            setProject(p);
            setPage('basic-studio');
          }}
          projects={projects}
        />
      )}
      {page === 'template-selector' && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onBack={() => setPage('dashboard')}
        />
      )}
      {page === 'basic-generator' && (
        <BasicGenerator
          onGenerate={handleGenerate}
          onBack={() => setPage('template-selector')}
        />
      )}
      {page === 'basic-studio' && project && (
        <BasicStudio
          project={project}
          onBack={() => setPage('basic-generator')}
          onRename={(newTitle) => {
            const updated = {...project, title:newTitle};
            setProject(updated);
            setProjects((prev)=>
              prev.map((p) => (p.title === project.title && p.narration === project.narration ? updated : p))
            );
          }}
        />
      )}
    </div>
  );

}


export default AppRouter;
