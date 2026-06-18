export interface SceneFrame {
  sceneIndex: number;
  localFrame: number;
  progress: number;
  globalFrame: number;
}

export function getGlobalFrame(
  sceneIndex: number,
  localFrame: number,
  sceneDurations: number[],
): number {
  const totalScenes = sceneDurations.length;
  if (totalScenes === 0) return 0;

  const clampedIndex = Math.min(sceneIndex, totalScenes - 1);

  let sum = 0;
  for (let i = 0; i < clampedIndex; i++) {
    sum += sceneDurations[i];
  }

  const maxLocal = sceneDurations[clampedIndex];
  const clampedLocal = Math.min(localFrame, maxLocal);

  return sum + clampedLocal;
}

export function getSceneFrame(
  globalFrame: number,
  sceneDurations: number[],
): SceneFrame {
  const totalFrames = sceneDurations.reduce((a, b) => a + b, 0);
  const clampedGlobal = Math.min(globalFrame, Math.max(totalFrames - 1, 0));

  let accumulated = 0;
  for (let i = 0; i < sceneDurations.length; i++) {
    const dur = sceneDurations[i];
    if (clampedGlobal < accumulated + dur) {
      const localFrame = clampedGlobal - accumulated;
      return {
        sceneIndex: i,
        localFrame,
        progress: dur > 0 ? localFrame / dur : 1,
        globalFrame,
      };
    }
    accumulated += dur;
  }

  if (sceneDurations.length === 0) {
    return { sceneIndex: 0, localFrame: 0, progress: 0, globalFrame };
  }
  const lastIdx = sceneDurations.length - 1;
  const lastDur = sceneDurations[lastIdx];
  return {
    sceneIndex: lastIdx,
    localFrame: Math.min(clampedGlobal - accumulated, lastDur - 1),
    progress: 1,
    globalFrame,
  };
}
