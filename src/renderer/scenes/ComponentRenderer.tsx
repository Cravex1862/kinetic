import React from 'react';
import * as Structural from '../primitives/StructuralSDK';
import * as Transition from '../primitives/TransitionSDK';
import * as Motion from '../primitives/MotionSDK';
import * as Charts from '../primitives/ChartsSDK';
import * as Cards from '../primitives/CardSDK';
import * as Interaction from '../primitives/InteractionSDK';
import { Morph } from '../primitives/MorphSDK';
import { morphSchemas } from '../primitives/MorphRegistry';
import type { ComponentNode, AnimationKeyframe } from '../agents/types';

const COMPONENT_REGISTRY: Record<string, React.FC<any>> = {
  ...Structural,
  ...Transition,
  ...Motion,
  ...Charts,
  ...Cards,
  ...Interaction,
};

interface ComponentRendererProps {
  node: ComponentNode;
  keyframes: AnimationKeyframe[];
  localFrame: number;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({ node, keyframes, localFrame }) => {
  const Comp = COMPONENT_REGISTRY[node.type];
  if (!Comp) {
    return (
      <div className="border border-red-500 p-2 text-red-500 text-xs">
        Missing: {node.type}
      </div>
    );
  }

  const keyframe = keyframes.find(
    (kf) => kf.component === node.type || (node.props.id && kf.component === node.props.id)
  );

  const renderChildren = () => {
    if (!node.children || node.children.length === 0) return null;
    return node.children.map((child, i) => (
      <ComponentRenderer key={i} node={child} keyframes={keyframes} localFrame={localFrame} />
    ));
  };

  if (keyframe) {
    const schema = morphSchemas[node.type] || {};
    return (
      <Morph
        from={keyframe.from}
        to={keyframe.to}
        schema={schema}
        frame={localFrame}
        duration={keyframe.duration}
        easing={(keyframe.easing as any) || 'ease-in-out'}
      >
        {(resolvedProps) => (
          <Comp {...node.props} {...resolvedProps}>
            {renderChildren()}
          </Comp>
        )}
      </Morph>
    );
  }

  return (
    <Comp {...node.props}>
      {renderChildren()}
    </Comp>
  );
};
