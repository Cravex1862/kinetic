// src/renderer/pages/PromptSandbox.tsx
import React, { useEffect, useState } from 'react';
import { getAllPrimitiveNames, getPrimitiveSpec, ingestPrimitiveSourceCode } from '../agents/primitiveRegistry';
import { getAllSkillNames } from '../utils/skillRAG';
import skillsData from '../../../skills/skills-index.json';
import { loadDesignSpec, AVAILABLE_DESIGN_SPEC_KEYS } from '../agents/designSpecLoader';
import { MASTER_DIRECTOR_SYSTEM, PER_SCENE_SUBAGENT_SYSTEM } from '../agents/subagents/storyboardAgent';
import { SCENE_COMPILER_SYSTEM, } from '../agents/subagents/sceneCompilerAgent';



interface SkillEntry {
  name: string;
  category: string;
  description: string;
  cleanContent: string;
  score?: number;
}

export const PromptSandbox: React.FC = () => {
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'primitives' | 'skills' | 'designs' | 'current'>('primitives');
  const [primitives, setPrimitives] = useState<string[]>([]);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [designs, setDesigns] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const agents = ['Storyboard', 'SceneCompiler']
  // Load data on mount
  useEffect(() => {

    setPrimitives(getAllPrimitiveNames());
    setSkills(skillsData);
    setDesigns(AVAILABLE_DESIGN_SPEC_KEYS);

  }, []);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const [primitiveCode, setPrimitiveCode] = useState<string>('');
  const [designSpec, setDesignSpec] = useState<string>('');

  // Load primitive source code when a primitive is selected
  useEffect(() => {
    if (activeTab === 'primitives' && selected) {
      ingestPrimitiveSourceCode([selected]).then((map) => {
        setPrimitiveCode(map[selected] || '');
      }).catch(() => setPrimitiveCode(''));
    }
    else {
      setPrimitiveCode('');
    }
    if (activeTab === 'designs' && selected) {
      loadDesignSpec(selected).then((spec) => {
        setDesignSpec(JSON.stringify(spec, null, 2));
      })
    }
    else {
      setDesignSpec('');
    }
  }, [activeTab, selected]);




  const buildPrompt = () => {
    if (!selected) return '';
    if (activeTab === 'primitives') {
      const spec = getPrimitiveSpec(selected);
      return `=== Primitive Spec: ${selected} ===\n${spec}`;
    }
    if (activeTab === 'skills') {
      const skill = skills.find((s) => s.name === selected);
      if (!skill) return '';
      return `=== Skill: ${skill.name} (Category: ${skill.category}) ===\nDescription: ${skill.description}\nContent:\n${skill.cleanContent}`;
    }
    if (activeTab === 'designs') {
      // Load design file content lazily
      const path = selected;
      return `=== Design Spec: ${path} ===\n ${designSpec}`;
    }
    if (activeTab === 'current') {
      switch (selected) {
        case 'Storyboard':
          return `${MASTER_DIRECTOR_SYSTEM} \n ================= Pass 2 ================= \n ${PER_SCENE_SUBAGENT_SYSTEM}`;
        case 'SceneCompiler':
          return `${SCENE_COMPILER_SYSTEM}`;
      }

    }
    return '';
  };

  const [selectedTabPrimitive, setSelectedTabPrimitive] = useState<string>('');
  const [selectedTabSkill, setSelectedTabSkill] = useState<string>('');
  const [selectedTabDesign, setSelectedTabDesign] = useState<string>('');

  const renderList = () => {
    const items =
      activeTab === 'primitives'
        ? primitives
        : activeTab === 'skills'
          ? skills.map((s) => s.name)
          : activeTab === 'designs'
            ? designs
            : agents;
    const setSel = (item: string) => {
      setSelected(item);
      if (activeTab === 'primitives') setSelectedTabPrimitive(item);
      if (activeTab === 'skills') setSelectedTabSkill(item);
      if (activeTab === 'designs') setSelectedTabDesign(item);
    };
    return (
      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <li
            key={item}
            className={`cursor-pointer px-3 py-1 rounded ${item === selected ? 'bg-purple-600/30' : 'hover:bg-gray-800'} `}
            onClick={() => setSel(item)}
          >
            {item}
          </li>
        ))}
      </ul>
    );
  };


  const prompt = buildPrompt();

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">Prompt Sandbox</h1>
      {loadError && <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded">{loadError}</div>}
      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${activeTab === 'primitives' ? 'bg-purple-600' : 'bg-gray-800'} `}
          onClick={() => { setActiveTab('primitives'); setSelected(''); }}
        >
          Primitives
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'skills' ? 'bg-purple-600' : 'bg-gray-800'} `}
          onClick={() => { setActiveTab('skills'); setSelected(''); }}
        >
          Skills
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'designs' ? 'bg-purple-600' : 'bg-gray-800'} `}
          onClick={() => { setActiveTab('designs'); setSelected(''); }}
        >
          Design Specs
        </button>
        <button
          className={`px-4 py-2 rounded ${activeTab === 'current' ? 'bg-purple-600' : 'bg-gray-800'} `}
          onClick={() => { setActiveTab('current'); setSelected(''); }}
        >
          Current Prompt
        </button>
      </div>

      <div className="flex flex-1 gap-6">
        {/* List */}
        <div className="w-1/3 overflow-auto border border-gray-700 rounded p-2 bg-gray-900">
          {renderList()}
          {
            activeTab === 'skills' && (
              <div>
                {getAllSkillNames().join(', ')}
              </div>
            )
          }
        </div>

        {/* Prompt display */}
        <div className="flex-1 relative">
          {prompt ? (
            <pre className="bg-gray-900 p-4 rounded overflow-auto h-full whitespace-pre-wrap">
              {prompt}
            </pre>
          ) : (
            <p className="text-gray-400">Select an item to view its prompt.</p>
          )}
          {prompt && (
            <button
              className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded"
              onClick={() => handleCopy(prompt)}
              title="Copy prompt"
            >
              {copied ? '✅ Copied' : 'Copy'}
            </button>
          )}
          {/* Primitive Code copy button */}
          {activeTab === 'primitives' && primitiveCode && (
            <button
              className="absolute top-2 right-20 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded"
              onClick={() => handleCopy(primitiveCode)}
              title="Copy primitive source code"
            >
              Copy Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptSandbox;
