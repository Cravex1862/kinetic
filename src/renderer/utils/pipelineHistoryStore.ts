import type { PipelineState } from "../agents/types";

let history: PipelineState[] = [];

export function appendPipelineState(
  current: PipelineState[],
  next: PipelineState,
): PipelineState[] {
  if (current.length === 0) {
    return next.status === "idle" ? current : [next];
  }
  const last = current[current.length - 1];
  if (last.status !== next.status) {
    return [...current, next];
  }
  return [...current.slice(0, -1), { ...last, ...next }];
}

export const pipelineHistory = {
  get: (): PipelineState[] => history,
  set: (states: PipelineState[]): void => {
    history = states;
  },
  record: (next: PipelineState): void => {
    history = appendPipelineState(history, next);
  },
  reset: (): void => {
    history = [];
  },
};
