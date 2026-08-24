import React from "react";

const BrokenScene: React.FC = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0b0b14",
    }}
  >
    <div
      style={{
        color: "#f87171",
        fontFamily: "Inter, sans-serif",
        fontSize: 24,
        textAlign: "center",
        padding: 24,
        lineHeight: 1.5,
      }}
    >
      Agent outputted errored code.
      <br />
      The video composition could not be displayed.
    </div>
  </div>
);

interface BoundaryState {
  hasError: boolean;
}

class CompositionErrorBoundary extends React.Component<
  { children: React.ReactNode },
  BoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("[SafeComposition] Composition crashed at render time:", error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) return <BrokenScene />;
    return this.props.children;
  }
}

const LazyComposition = React.lazy(async () => {
  try {
    const mod = await import("./VideoComposition");
    return { default: mod.default ?? BrokenScene };
  } catch (err) {
    console.error("[SafeComposition] Failed to load VideoComposition:", err);
    return { default: BrokenScene };
  }
});

export const SafeComposition: React.FC = () => (
  <CompositionErrorBoundary>
    <React.Suspense fallback={null}>
      <LazyComposition />
    </React.Suspense>
  </CompositionErrorBoundary>
);

export default SafeComposition;
