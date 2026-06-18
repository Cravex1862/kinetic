import type { StoryboardScene, ComponentTree, AnimationPlan, SceneOutput } from './types';

export function compileScene(
  scene: StoryboardScene,
  components: ComponentTree,
  animation: AnimationPlan,
  copy: { captions: string[]; labels: string[]; voiceover: string },
): SceneOutput {
  return {
    sceneId: scene.id,
    description: scene.description,
    duration: scene.duration,
    components: components.components,
    keyframes: animation.keyframes,
    narration: scene.narration,
    captions: copy.captions,
  };
}

export function compileAllScenes(
  scenes: StoryboardScene[],
  componentTrees: ComponentTree[],
  animationPlans: AnimationPlan[],
  copies: Array<{ captions: string[]; labels: string[]; voiceover: string }>,
): SceneOutput[] {
  return scenes.map((scene, i) =>
    compileScene(
      scene,
      componentTrees[i] ?? { components: [] },
      animationPlans[i] ?? { keyframes: [] },
      copies[i] ?? { captions: [], labels: [], voiceover: scene.narration },
    )
  );
}
