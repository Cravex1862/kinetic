import React from "react";
import { GithubLogo, Folder, XCircle } from "@phosphor-icons/react";
import type { RepoStageApproval } from "../../agents/pipeline";

export interface RepoScanStageProps {
  repoLink?: string;
  setRepoLink?: (value: string) => void;
  scanning?: boolean;
  selectedRepoPath?: string;
  scannedExports?: ScrapedFindings | null;
  packStats?: RepoPackResult | null;
  onScanGit?: () => void;
  onSelectFolder?: () => void;
  onViewReport?: () => void;
  onSkip?: () => void;
  onApprove?: (data?: RepoStageApproval) => void;
}

export const RepoScanStage: React.FC<RepoScanStageProps> = ({
  repoLink = "",
  setRepoLink,
  scanning = false,
  selectedRepoPath = "",
  scannedExports = null,
  packStats = null,
  onScanGit,
  onSelectFolder,
  onViewReport,
  onSkip,
  onApprove,
}) => {
  const hasScrapeControls = Boolean(onScanGit || onSelectFolder);

  return (
    <div className="flex flex-col gap-2.5 pb-1">
      <p className="text-[10px] text-gray-500 leading-relaxed">
        Scan your product&apos;s codebase so generated scenes match your real
        app — routes, components, brand colors and fonts.
      </p>

      {hasScrapeControls ? (
        <>
          {onScanGit && (
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <GithubLogo className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={repoLink}
                  onChange={(e) => setRepoLink?.(e.target.value)}
                  placeholder="Enter Git repository link..."
                  disabled={scanning}
                  className="w-full premium-input pl-9 pr-3 py-1.5 text-xs rounded-lg bg-gray-950/60"
                />
              </div>
              {repoLink.trim() && (
                <button
                  onClick={onScanGit}
                  disabled={scanning}
                  className="px-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {scanning ? "Cloning..." : "Scrape"}
                </button>
              )}
            </div>
          )}

          {onSelectFolder && (
            <>
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-900" />
                </div>
                <span className="relative bg-gray-900 px-2 text-[10px] text-gray-600">
                  Or
                </span>
              </div>

              <button
                onClick={onSelectFolder}
                disabled={scanning}
                className="flex items-center justify-center gap-2 w-full premium-button-secondary py-2 text-xs rounded-lg hover:border-emerald-500/30 transition-colors"
              >
                <Folder size={16} className="text-emerald-400" />
                {scanning
                  ? "Scanning Files..."
                  : selectedRepoPath
                    ? "Change Selected Directory"
                    : "Upload Local Repo"}
              </button>
            </>
          )}

          {selectedRepoPath && (
            <div className="text-[10px] text-gray-500 bg-gray-950/80 p-2 rounded border border-gray-900 truncate">
              <span className="text-emerald-400 font-semibold">Loaded:</span>{" "}
              {selectedRepoPath}
            </div>
          )}

          {(scannedExports || packStats) && (
            <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-900 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-gray-400">
                <span>
                  Components:{" "}
                  <b className="text-purple-400">
                    {scannedExports?.components.length ?? 0}
                  </b>
                </span>
                <span>
                  Colors:{" "}
                  <b className="text-emerald-400">
                    {scannedExports?.colors.length ?? 0}
                  </b>
                </span>
                <span>
                  Routes:{" "}
                  <b className="text-blue-400">
                    {scannedExports?.routes.length ?? 0}
                  </b>
                </span>
                <span>
                  Fonts:{" "}
                  <b className="text-amber-400">
                    {scannedExports?.fonts.length ?? 0}
                  </b>
                </span>
              </div>
              {packStats && (
                <span className="text-[9px] text-gray-500">
                  Repomix pack: {packStats.totalFiles} files ·{" "}
                  {(packStats.totalCharacters / 1000).toFixed(1)}k chars packed
                </span>
              )}
              {onViewReport && scannedExports && (
                <button
                  type="button"
                  onClick={onViewReport}
                  className="w-full py-1 text-[9px] font-bold tracking-wide bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors"
                >
                  View Full Scraped Report
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="border border-gray-800 rounded-md p-3 bg-gray-950/60">
          <p className="text-[10px] text-gray-500">
            Repo scanning is available for SaaS demo videos. This template will
            continue without codebase context.
          </p>
        </div>
      )}

      <button
        onClick={() => (onSkip ?? onApprove)?.()}
        disabled={scanning}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 text-[10px] font-semibold rounded-lg border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors disabled:opacity-50"
      >
        <XCircle size={12} />
        Skip — generate without repo context
      </button>
    </div>
  );
};

export default RepoScanStage;
