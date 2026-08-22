import React, { useEffect } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { BrandStylingPanel, StylingProps } from "./BrandStylingPanel";
import { BackgroundSelection } from "./BackgroundSelectorPanel";
import { PipelineState, SceneBlueprint, SceneCode } from "../agents/types";
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

interface StatusRendererProps extends StylingProps {
  state: PipelineState;
  questions: ClientInterviewQuestion[];
  customAlert: (title: string, message: string) => Promise<void>;
  onSubmitAnswers: (id: number, question: string, answer: string) => void;
  onApproveStage?: (data?: any) => void;
  answers?: ClientInterViewAnswers[];
  blueprints?: SceneBlueprint[];
  sceneCodes?: SceneCode[];
}

interface InstructionProps {
  state: PipelineState;
  instructions: string;
  setInstructions: (val: string) => void;
  isRefining?: boolean;
  handleRefinePrompt?: () => void;
  placeholder?: string;
  StatusProps: StatusRendererProps;
}

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
}: StatusRendererProps) {
  switch (state.status) {
    case "designing":
      return (
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
      );
    case "interviewing":
      return (
        <InterviewingStage
          questions={questions}
          answers={answers}
          customAlert={customAlert}
          onSubmitAnswers={(submittedAnswers) => {
            submittedAnswers.forEach((a) =>
              onSubmitAnswers(a.id, a.question, a.answer),
            );
            onApproveStage?.(submittedAnswers);
          }}
        />
      );
    case "storyboarding":
      return <StoryboardingStage blueprints={blueprints || []} />;
    case "sceneCreation":
      return <SceneCreationStage sceneCodes={sceneCodes || []} />;
    case "assembling":
      return (
        <AssemblingStage
          sceneCodes={sceneCodes || []}
          progress={state.progress}
        />
      );
    case "verifying":
      return (
        <VerifyingStage
          assembled={state.assembled}
          finalCode={state.finalCode}
        />
      );
    case "done":
      return <DoneStage sceneCount={sceneCodes?.length || 0} />;
    case "error":
      return <ErrorStage error={state.error} />;
    default:
      return null;
  }
}

export const AIsidebar: React.FC<InstructionProps> = ({
  setInstructions,
  isRefining = false,
  handleRefinePrompt,
  placeholder = "Describe custom layout or animation instructions...",
  StatusProps,
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  let submitedAnswers: ClientInterViewAnswers[] = [];
  const [states, setStates] = React.useState<PipelineState[]>([]);

  React.useEffect(() => {
    if (StatusProps.state) {
      setStates((prevStates) => {
        const laststate = prevStates[prevStates.length - 1];
        if (!laststate || laststate.status !== StatusProps.state.status) {
          return [...prevStates, StatusProps.state];
        }
        return prevStates;
      });
    }
  }, [StatusProps.state]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`;
    }
  }, [StatusProps.state]);

  return (
    <section
      className="bg-gray-900/40 border border-gray-900 rounded-xl p-4 flex flex-col w-full h-full"
      id="sidebar"
    >
      <div className="flex items-center justify-between border-b border-gray-900 pb-2">
        <h4 className="text-xs font-bold text-gray-400 ">
          Generate your animations
        </h4>
      </div>
      <div className="grow m-2">
        {states.map((state, idx) => (
          <StatusRenderer
            key={idx}
            {...StatusProps}
            state={state}
            questions={state.questions || []}
            answers={submitedAnswers ? submitedAnswers : undefined}
            onSubmitAnswers={(id, question, answer) => {
              submitedAnswers.push({
                id,
                question,
                answer,
              });
            }}
            blueprints={state.blueprints || []}
            sceneCodes={state.sceneCodes || []}
          />
        ))}
      </div>
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={placeholder}
          className={`w-full min-h-[80px] resize-none premium input p-2  text-xs rounded-lg bg-gray-950/60 font-sans transition-all overflow-hidden duration-500 ${
            isRefining
              ? "border-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              : "border-slate-700"
          }`}
        />
        {handleRefinePrompt && (
          <button
            onClick={handleRefinePrompt}
            disabled={isRefining}
            className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-md bg-transparent text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <Sparkle size={14} weight="fill" className="white" />
            )}
          </button>
        )}
      </div>
    </section>
  );
};
