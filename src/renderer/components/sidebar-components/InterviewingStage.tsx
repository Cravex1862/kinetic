import React from "react";
import { Check } from "@phosphor-icons/react";
import {
  ClientInterViewAnswers,
  ClientInterviewQuestion,
} from "@/renderer/agents/subagents/storyboardAgent";

interface QuestionCardProps {
  question: ClientInterviewQuestion;
  customAlert: (title: string, message: string) => Promise<void>;
  onAnswer: (id: number, question: string, answer: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  customAlert,
  onAnswer,
}) => {
  const [inputValue, setInputValue] = React.useState<string | null>(null);
  const [isApproved, setIsApproved] = React.useState(false);

  return (
    <div className="border border-gray-800 m-4 rounded-md p-1 w-full max-w-md mx-auto flex flex-col items-center">
      <h4 className="text-gray-400 text-xs rounded-md bg-gray-900 m-2">
        Question {question.id} : {question.question}
      </h4>
      <div className="flex items-center justify-evenly w-full">
        {question.suggestedAnswers.map((suggestion) => (
          <button
            key={suggestion}
            className="text-white hover:text-purple-400 border border-gray-800 text-xs rounded-md p-1 m-1 grow"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div className="flex w-full">
        <input
          type="text"
          placeholder="Enter Answer..."
          className="rounded-md m-1 text-gray-400 text-sm p-1 pl-2 grow"
          value={inputValue ?? ""}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isApproved}
        />
        {!isApproved && (
          <button
            className="ml-2 rounded-md bg-green-500 p-2 hover:bg-green-400 m-1"
            onClick={async () => {
              if (inputValue) {
                onAnswer(question.id, question.question, inputValue);
                setIsApproved(true);
              } else {
                await customAlert(
                  "Enter Answer",
                  `Please enter an answer for question ${question.id}`,
                );
              }
            }}
          >
            <Check size={14} color="white" />
          </button>
        )}
      </div>
    </div>
  );
};

interface InterviewingStageProps {
  questions: ClientInterviewQuestion[];
  answers?: ClientInterViewAnswers[];
  customAlert: (title: string, message: string) => Promise<void>;
  onSubmitAnswers: (answers: ClientInterViewAnswers[]) => void;
}

export const InterviewingStage: React.FC<InterviewingStageProps> = ({
  questions,
  answers,
  customAlert,
  onSubmitAnswers,
}) => {
  const [isDone, setIsDone] = React.useState(false);
  const currentAnswers: ClientInterViewAnswers[] = [];

  if (isDone) {
    return (
      <div>
        {answers?.map((a) => (
          <div key={a.id}>
            <h4 className="text-gray-400 text-xs">
              Question {a.id}: {a.question}
            </h4>
            <h4 className="text-white text-xs bg-gray-800 p-2 rounded-md m-1">
              Answer: {a.answer}
            </h4>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-md mx-auto w-full">
      <div>
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            customAlert={customAlert}
            onAnswer={(id, question, answer) => {
              currentAnswers.push({ id, question, answer });
            }}
          />
        ))}
      </div>
      <button
        className="premium-button-primary p-1 rounded-md w-full max-w-md mx-auto"
        onClick={() => {
          setIsDone(true);
          onSubmitAnswers(currentAnswers);
        }}
      >
        Submit
      </button>
    </div>
  );
};

export default InterviewingStage;
