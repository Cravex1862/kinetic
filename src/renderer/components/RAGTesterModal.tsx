import React, { useState } from 'react';
import { X, MagnifyingGlass, Sparkle, CaretDown, CaretUp, Code } from '@phosphor-icons/react';
import { findRelevantSkills, RelevantSkill } from '../utils/skillRAG';

interface RAGTesterModalProps {
  onClose: () => void;
}

export const RAGTesterModal: React.FC<RAGTesterModalProps> = ({ onClose }) => {
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RelevantSkill[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleTest = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    try {
      const topSkills = await findRelevantSkills(promptText, 5);
      setResults(topSkills);
      setExpandedIndex(null);
    } catch (err) {
      console.error('Error running RAG test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleTest();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                RAG Vector Search Sandbox
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                  Ctrl+Shift+R
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                100% Offline AI Vector Matcher (all-mpnet-base-v2 ONNX)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Enter Test Prompt or Scene Description
            </label>
            <div className="relative">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Create a rising hero uptime card with 99.99% uptime and a real-time bar chart..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/60 resize-none font-sans"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-mono">Ctrl+Enter to run</span>
                <button
                  onClick={handleTest}
                  disabled={loading || !promptText.trim()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-purple-600/20"
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MagnifyingGlass size={14} weight="bold" />
                  )}
                  {loading ? 'Matching...' : 'Test Match'}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Top Matched Skills {results.length > 0 && `(${results.length})`}
              </h3>
              {results.length > 0 && (
                <span className="text-xs text-purple-400 font-mono">
                  Pure Vector Cosine Similarity
                </span>
              )}
            </div>

            {results.length === 0 && !loading && (
              <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-sm">
                Type a prompt above and click <span className="text-purple-400 font-medium">Test Match</span> to evaluate skill retrieval scores.
              </div>
            )}

            {results.map((skill, index) => {
              const matchPercentage = Math.max(0, Math.min(100, skill.score * 100)).toFixed(1);
              const isExpanded = expandedIndex === index;

              // Color badge based on match strength
              const isHigh = skill.score >= 0.7;
              const isMedium = skill.score >= 0.5 && skill.score < 0.7;

              return (
                <div
                  key={skill.name}
                  className="bg-zinc-950 border border-zinc-800/80 hover:border-purple-500/40 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 font-mono text-xs flex items-center justify-center font-bold">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {skill.name}
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-purple-300 border border-zinc-700">
                            {skill.category}
                          </span>
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-1 max-w-md">
                          {skill.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Match percentage badge */}
                      <div className="text-right">
                        <div
                          className={`text-sm font-black font-mono ${
                            isHigh
                              ? 'text-emerald-400'
                              : isMedium
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {matchPercentage}% match
                        </div>
                        <div className="w-24 bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHigh
                                ? 'bg-emerald-400'
                                : isMedium
                                ? 'bg-amber-400'
                                : 'bg-zinc-500'
                            }`}
                            style={{ width: `${matchPercentage}%` }}
                          />
                        </div>
                      </div>

                      <button className="text-zinc-500 hover:text-white p-1">
                        {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Markdown Content Preview */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-zinc-900 bg-zinc-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-mono text-purple-400 flex items-center gap-1">
                          <Code size={12} /> SKILL CONTENT PREVIEW
                        </span>
                      </div>
                      <pre className="text-xs text-zinc-300 font-mono bg-zinc-950 p-3 rounded-lg overflow-x-auto max-h-60 border border-zinc-800 whitespace-pre-wrap">
                        {skill.cleanContent}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs text-zinc-500">
          <span>Model: Xenova/all-mpnet-base-v2 (768d ONNX)</span>
          <span>Press ESC or click X to close</span>
        </div>
      </div>
    </div>
  );
};

export default RAGTesterModal;
