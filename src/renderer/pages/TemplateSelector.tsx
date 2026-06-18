import React from 'react';
import { BoundingBox, WaveSine, MagnifyingGlass } from '@phosphor-icons/react';

interface TemplateSelectorProps {
  onSelect: (template: 'basic-animation') => void;
  onBack: () => void;
}

const templates: {
  key: 'basic-animation';
  label: string;
  icon: React.ReactNode;
  features: string[];
}[] = [
  {
    key: 'basic-animation',
    label: 'Basic Animation',
    icon: <BoundingBox size={36} weight="duotone" className="text-indigo-400" />,
    features: ['Up to 1 min long', 'Fast tight motion'],
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
        >
          &larr;
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold">K</div>
        <span className="text-sm font-semibold">kinetic</span>
      </div>

      <h1 className="mb-10 mt-4 text-center text-sm font-medium uppercase tracking-widest text-gray-500">
        Select a Template
      </h1>

      <div className="flex gap-6">
        {templates.map((t) => (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className="group flex w-[200px] flex-col items-center gap-5 rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/60 px-6 py-10 text-center transition-all hover:border-indigo-500/50 hover:bg-gray-900"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-800 transition-colors group-hover:bg-indigo-600/10">
              {t.icon}
            </div>

            <span className="text-sm font-semibold text-white">{t.label}</span>

            <ul className="space-y-1.5">
              {t.features.map((f, i) => (
                <li key={i} className="text-xs leading-relaxed text-gray-500">
                  &bull; {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
