import React, { useEffect, useState, useCallback } from 'react';
import { ArrowRight, X } from '@phosphor-icons/react';

export interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourOverlayProps {
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onSkip: () => void;
}

const PADDING = 10; // px padding around spotlight element

const TourOverlay: React.FC<TourOverlayProps> = ({ steps, currentStep, onNext, onSkip }) => {
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [visible, setVisible] = useState(false);

  const step = steps[currentStep];

  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top - PADDING,
      left: r.left - PADDING,
      width: r.width + PADDING * 2,
      height: r.height + PADDING * 2,
    });
  }, [step]);

  // Measure on step change, with slight delay for page transitions
  useEffect(() => {
    setVisible(false);
    setRect(null);
    const t1 = setTimeout(() => {
      measureTarget();
    }, 350);
    const t2 = setTimeout(() => {
      setVisible(true);
    }, 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentStep, measureTarget]);

  // Re-measure on window resize
  useEffect(() => {
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [measureTarget]);

  if (!step) return null;

  // Tooltip position calculation
  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const GAP = 16;
    const tooltipW = 300;
    switch (step.placement) {
      case 'bottom':
        return {
          top: rect.top + rect.height + GAP,
          left: Math.max(8, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 8)),
        };
      case 'top':
        return {
          top: rect.top - GAP - 160, // approx tooltip height
          left: Math.max(8, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 8)),
        };
      case 'right':
        return {
          top: Math.max(8, rect.top + rect.height / 2 - 70),
          left: rect.left + rect.width + GAP,
        };
      case 'left':
        return {
          top: Math.max(8, rect.top + rect.height / 2 - 70),
          left: rect.left - tooltipW - GAP,
        };
    }
  };

  const isLast = currentStep === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[9990] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.25s ease' }}
    >
      {/* Dark overlay - uses SVG mask for spotlight cutout */}
      {rect ? (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ position: 'fixed' }}
        >
          <defs>
            <mask id="tour-mask">
              {/* White = visible area of overlay (darkened), black = spotlight (cut out) */}
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="10"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.78)"
            mask="url(#tour-mask)"
          />
          {/* Spotlight border ring */}
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx="10"
            fill="none"
            stroke="rgba(139, 92, 246, 0.6)"
            strokeWidth="1.5"
          />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-black/78 pointer-events-none" />
      )}

      {/* Tooltip card — pointer-events-auto so buttons work */}
      <div
        className="absolute pointer-events-auto z-[9991]"
        style={{ ...getTooltipStyle(), width: 300 }}
      >
        <div
          className="rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl shadow-black/60"
          style={{
            transition: 'transform 0.25s ease, opacity 0.25s ease',
            transform: visible ? 'translateY(0)' : 'translateY(6px)',
          }}
        >
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-5 bg-purple-500'
                      : i < currentStep
                      ? 'w-1.5 bg-purple-800'
                      : 'w-1.5 bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={onSkip}
              className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              aria-label="Skip tour"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          <h4 className="text-sm font-bold text-white mb-1 tracking-wide">{step.title}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={onSkip}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium"
            >
              Skip tour
            </button>
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-bold transition-all active:scale-[0.97] shadow-lg shadow-purple-600/20"
            >
              <span>{isLast ? 'Done' : 'Next'}</span>
              <ArrowRight size={13} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourOverlay;
