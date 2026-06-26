import React from 'react';
import * as Structural from '../primitives/StructuralSDK';
import * as Transition from '../primitives/TransitionSDK';
import * as Motion from '../primitives/MotionSDK';
import * as Charts from '../primitives/ChartsSDK';
import * as Cards from '../primitives/CardSDK';
import * as Interaction from '../primitives/InteractionSDK';
import * as Maps from '../primitives/MapSDK';
import { Morph } from '../primitives/MorphSDK';
import { morphSchemas } from '../primitives/MorphRegistry';
import type { ComponentNode, AnimationKeyframe } from '../agents/types';
import { useSignal } from '../primitives/useSignal';

const COMPONENT_REGISTRY: Record<string, React.FC<any>> = {
  ...Structural,
  ...Transition,
  ...Motion,
  ...Charts,
  ...Cards,
  ...Interaction,
  ...Maps,
};

interface ComponentRendererProps {
  node: ComponentNode;
  keyframes: AnimationKeyframe[];
  localFrame: number;
}

class ComponentErrorBoundary extends React.Component<{ children: React.ReactNode; componentName: string }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in component ${this.props.componentName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-500 bg-red-950/20 p-2 text-red-500 text-xs rounded">
          <strong>Error in {this.props.componentName}:</strong> {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
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

  const nodeProps = node.props as any;

  const keyframe = keyframes.find(
    (kf) => kf.component === node.type || (nodeProps.id && kf.component === nodeProps.id)
  );

  const renderChildren = () => {
    if (!node.children || node.children.length === 0) return null;
    return node.children.map((child, i) => (
      <ComponentRenderer key={i} node={child} keyframes={keyframes} localFrame={localFrame} />
    ));
  };

  const triggerFrame = useSignal(nodeProps.signalIn);
  let activeFrame = localFrame;
  let overriddenProps = { ...nodeProps };

  if (triggerFrame !== null) {
    const triggered = localFrame >= triggerFrame;
    activeFrame = triggered ? localFrame - triggerFrame : 0;

    if (nodeProps.signalIn?.action === 'expand') {
      overriddenProps.expanded = triggered;
    }
    else if (nodeProps.signalIn?.action === 'toggle') {
      overriddenProps.toggled = triggered;
    }
    else if (nodeProps.signalIn?.action === 'show') {
      overriddenProps.visible = triggered;
    }
  }

  const renderContent = () => {
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
            <Comp frame={activeFrame} {...overriddenProps} {...resolvedProps}>
              {renderChildren()}
            </Comp>
          )}
        </Morph>
      );
    }

    return (
      <Comp frame={activeFrame} {...overriddenProps}>
        {renderChildren()}
      </Comp>
    );
  };

  return (
    <ComponentErrorBoundary componentName={node.type}>
      <div
        id={nodeProps.id}
        data-click-frame={nodeProps.clickFrame}
        data-signal-event={nodeProps.signalOut?.event}
        data-signal-frame={nodeProps.signalOut?.frame}
        style={{ display: 'contents' }}
      >
        {renderContent()}
      </div>
    </ComponentErrorBoundary>
  );
};
