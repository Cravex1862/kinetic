import React from "react";
import { Sparkle, CaretDown, CaretLeft } from "@phosphor-icons/react";
import { StylingProps } from "./BrandStylingPanel";
import type { PipelineState, SceneBlueprint, SceneCode } from "../agents/types";
import {
  ClientInterViewAnswers,
  ClientInterviewQuestion,
} from "../agents/subagents/storyboardAgent";
import { DesigningStage } from "./sidebar-components/DesigningStage";
import { InterviewingStage } from "./sidebar-components/InterviewingStage";
import { StoryboardingStage } from "./sidebar-components/StoryboardingStage";
import { SceneCreationStage } from "./sidebar-components/SceneCreation";
import { AssemblingStage } from "./sidebar-components/AssemblingStage";
import { VerifyingStage } from "./sidebar-components/VerifyingStage";
import { DoneStage } from "./sidebar-components/DoneStage";
import { ErrorStage } from "./sidebar-components/ErrorStage";
import { RepoScanStage } from "./sidebar-components/RepoScanStage";
import type { RepoScanStageProps } from "./sidebar-components/RepoScanStage";

interface StatusRendererProps extends StylingProps {
  state: PipelineState;
  questions?: ClientInterviewQuestion[];
  customAlert: (title: string, message: string) => Promise<void>;
  onSubmitAnswers: (id: number, question: string, answer: string) => void;
  onApproveStage?: (data?: any) => void;
  answers?: ClientInterViewAnswers[];
  blueprints?: SceneBlueprint[];
  sceneCodes?: SceneCode[];
  repoScan?: RepoScanStageProps;
  isActive?: boolean;
}

interface InstructionProps {
  state: PipelineState;
  instructions: string;
  setInstructions: (val: string) => void;
  isRefining?: boolean;
  handleRefinePrompt?: () => void;
  placeholder?: string;
  StatusProps: StatusRendererProps;
  initialStates?: PipelineState[];
  hidePrompt?: boolean;
}

interface StageSectionProps {
  label: string;
  isActive: boolean;
  accentClass?: string;
  children: React.ReactNode;
}

const StageSection: React.FC<StageSectionProps> = ({
  label,
  isActive,
  accentClass = "text-gray-400",
  children,
}) => {
  const [override, setOverride] = React.useState<boolean | null>(null);
  const isOpen = override ?? isActive;

  return (
    <div className="stage-enter mb-1 rounded-lg">
      <div
        className="flex items-center justify-between px-1 py-1 cursor-pointer select-none group"
        onClick={() => setOverride(!isOpen)}
      >
        <h4
          className={`text-[11px] font-bold tracking-wide ${accentClass} ${
            isActive ? "" : "opacity-70"
          }`}
        >
          {label}
        </h4>
        <span className="text-gray-500 group-hover:text-gray-300 transition-colors">
          {isOpen ? (
            <CaretDown size={11} weight="bold" />
          ) : (
            <CaretLeft size={11} weight="bold" />
          )}
        </span>
      </div>
      {isOpen && <div className="px-1 pb-2">{children}</div>}
    </div>
  );
};

function StatusRenderer({
  fonts,
  setFonts,
  swatches,
  setSwatches,
  availableFonts,
  bgSelection,
  onSelectBackground,
  state,
  questions,
  customAlert,
  onSubmitAnswers,
  onApproveStage,
  answers,
  blueprints,
  sceneCodes,
  repoScan,
  isActive = false,
}: StatusRendererProps) {
  switch (state.status) {
    case "repoScan":
      return (
        <StageSection label="Repo Scan" isActive={isActive}>
          <RepoScanStage {...repoScan} onApprove={onApproveStage} />
        </StageSection>
      );
    case "designing":
      return (
        <StageSection label="Designing" isActive={isActive}>
          <DesigningStage
            fonts={fonts}
            setFonts={setFonts}
            swatches={swatches}
            setSwatches={setSwatches}
            availableFonts={availableFonts}
            bgSelection={bgSelection}
            onSelectBackground={onSelectBackground}
            onApprove={onApproveStage}
          />
        </StageSection>
      );
    case "interviewing":
      return (
        <StageSection label="Interview" isActive={isActive}>
          <InterviewingStage
            questions={questions || []}
            answers={answers}
            customAlert={customAlert}
            onSubmitAnswers={(submittedAnswers) => {
              submittedAnswers.forEach((a) =>
                onSubmitAnswers(a.id, a.question, a.answer),
              );
              onApproveStage?.(submittedAnswers);
            }}
          />
        </StageSection>
      );
    case "storyboarding":
      return (
        <StageSection label="Storyboarding" isActive={isActive}>
          <StoryboardingStage blueprints={blueprints || []} />
        </StageSection>
      );
    case "sceneCreation":
      return (
        <StageSection label="Creating Scenes" isActive={isActive}>
          <SceneCreationStage sceneCodes={sceneCodes || []} />
        </StageSection>
      );
    case "assembling":
      return (
        <StageSection label="Assembling" isActive={isActive}>
          <AssemblingStage
            sceneCodes={sceneCodes || []}
            progress={state.progress}
          />
        </StageSection>
      );
    case "verifying":
      return (
        <StageSection label="Verifying" isActive={isActive}>
          <VerifyingStage
            assembled={state.assembled}
            finalCode={state.finalCode}
          />
        </StageSection>
      );
    case "done":
      return (
        <StageSection
          label="Complete"
          isActive={isActive}
          accentClass="text-green-400"
        >
          <DoneStage sceneCount={sceneCodes?.length || 0} />
        </StageSection>
      );
    case "error":
      return (
        <StageSection
          label="Error"
          isActive={isActive}
          accentClass="text-red-400"
        >
          <ErrorStage error={state.error} />
        </StageSection>
      );
    default:
      return null;
  }
}

export const AIsidebar: React.FC<InstructionProps> = ({
  instructions,
  setInstructions,
  isRefining = false,
  handleRefinePrompt,
  placeholder = "Describe custom layout or animation instructions...",
  StatusProps,
  initialStates,
  hidePrompt = false,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const submitedAnswersRef = React.useRef<ClientInterViewAnswers[]>([]);
  const [states, setStates] = React.useState<PipelineState[]>(
    () =>
      (initialStates || []).filter(
        (s) => s.status !== "idle" && s.status !== "repoScan",
      ),
  );

  React.useEffect(() => {
    if (StatusProps.state) {
      setStates((prevStates) => {
        const laststate = prevStates[prevStates.length - 1];
        if (!laststate) {
          if (StatusProps.state.status === "idle") return prevStates;
          return [...prevStates, StatusProps.state];
        }
        if (laststate.status !== StatusProps.state.status) {
          return [...prevStates, StatusProps.state];
        }
        if (laststate === StatusProps.state) {
          return prevStates;
        }
        return [
          ...prevStates.slice(0, -1),
          { ...laststate, ...StatusProps.state },
        ];
      });
    }
  }, [StatusProps.state]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`;
    }
  }, [StatusProps.state]);

  const activeStatus =
    states.length > 0 ? states[states.length - 1].status : null;

  return (
    <section
      className="flex flex-col w-full h-full"
      id="sidebar"
    >
      {!hidePrompt && (
        <div className="flex items-center justify-between pb-2">
          <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Prompt
          </h4>
        </div>
      )}
      <div className="grow m-2 overflow-y-auto">
        {states.length === 0 && (
          <p className="text-[10px] text-gray-600 leading-relaxed mt-1 mb-2 hidden">
            Describe your video below and hit send to start the pipeline.
          </p>
        )}
        {states.map((state, idx) => (
          <StatusRenderer
            key={`${idx}-${state.status}`}
            {...StatusProps}
            state={state}
            questions={state.questions || []}
            answers={submitedAnswersRef.current.length > 0 ? submitedAnswersRef.current : undefined}
            onSubmitAnswers={(id, question, answer) => {
              submitedAnswersRef.current.push({
                id,
                question,
                answer,
              });
            }}
            blueprints={state.blueprints || []}
            sceneCodes={state.sceneCodes || []}
            isActive={state.status === activeStatus}
          />
        ))}
      </div>
      {!hidePrompt && (
        <div className="relative w-full">
          <div className="relative flex items-center bg-[#1a1a1e] border border-[#27272a] rounded-full p-1 gap-1 transition-all focus-within:border-violet-500/50">
            <textarea
              ref={textareaRef}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={placeholder}
              value={instructions}
              rows={1}
              className={`flex-1 bg-transparent border-none pl-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 resize-none outline-none rounded-full font-sans overflow-hidden ${
                isRefining ? "animate-pulse" : ""
              }`}
              style={{ fieldSizing: "content" as React.CSSProperties["fieldSizing"] }}
            />
            {handleRefinePrompt && (
              <button
                onClick={handleRefinePrompt}
                disabled={isRefining || !instructions.trim()}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-all active:scale-95 shadow-lg shadow-violet-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Refine prompt with AI"
              >
                {isRefining ? (
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AIsidebar;
