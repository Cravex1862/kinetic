export interface NarrationChunk {
  sceneIndex: number;
  text: string;
  startFrame: number;
  endFrame: number;
  duration: number;
}

export function parseNarration(
  sceneNarrations: string[],
  sceneDurations: number[],
): NarrationChunk[] {
  const len = Math.min(sceneNarrations.length, sceneDurations.length);
  const result: NarrationChunk[] = [];
  let cumulative = 0;
  for (let i = 0; i < len; i++) {
    const duration = sceneDurations[i];
    result.push({
      sceneIndex: i,
      text: sceneNarrations[i],
      startFrame: cumulative,
      endFrame: cumulative + duration,
      duration,
    });
    cumulative += duration;
  }
  return result;
}

export function calculateDuration(
  text: string,
  wpm: number,
  fps: number,
): number {
  if (wpm <= 0) return 30;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const wordsPerFrame = wpm / 60 / fps;
  return Math.max(1, Math.ceil(wordCount / wordsPerFrame));
}
