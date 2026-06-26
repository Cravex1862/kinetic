import { useCurrentFrame } from 'remotion';

export function useFrame(frame?: number): number {
  if (frame !== undefined) return frame;
  try {
    return useCurrentFrame();
  } catch {
    return 0;
  }
}
