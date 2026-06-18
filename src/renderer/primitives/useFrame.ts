import { useCurrentFrame } from 'remotion';

export function useFrame(frame?: number): number {
  if (frame !== undefined) return frame;
  return useCurrentFrame();
}
