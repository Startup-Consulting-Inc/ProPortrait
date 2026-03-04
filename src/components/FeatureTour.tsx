import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight } from 'lucide-react';

interface FeatureTourProps {
  active: boolean;
  onDone: () => void;
}

interface TourStep {
  target: string;
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'identity-locks',
    title: 'Identity Locks',
    content: 'Lock your eye color, skin tone, and hair so AI never changes them — your biggest competitive differentiator.',
  },
  {
    target: 'comparison-slider',
    title: 'Before & After',
    content: 'Drag to compare your original photo and AI portrait side by side.',
  },
  {
    target: 'regional-edit',
    title: 'Regional Edit',
    content: 'Select a region to edit just that part — background, clothing, or lighting — without touching the rest.',
  },
  {
    target: 'history',
    title: 'Edit History',
    content: 'Click any thumbnail to jump back to a previous version. Never lose a good portrait.',
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function FeatureTour({ active, onDone }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const findAndSetRect = useCallback((target: string) => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    setTargetRect({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    setCurrentStep(0);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;
    // Small delay to let the DOM settle (e.g., after opening an edit panel)
    const timer = setTimeout(() => findAndSetRect(step.target), 100);
    return () => clearTimeout(timer);
  }, [active, currentStep, findAndSetRect]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      onDone();
    }
  };

  if (!active) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;
  const PADDING = 8;

  // Tooltip positioning: below target if space, otherwise above
  let tooltipTop = 0;
  let tooltipLeft = 0;
  if (targetRect) {
    tooltipTop = targetRect.top + targetRect.height + PADDING + 12;
    tooltipLeft = Math.max(16, Math.min(
      targetRect.left,
      window.innerWidth - 320 - 16,
    ));
    // If tooltip would go off-bottom, place above
    if (tooltipTop + 160 > window.scrollY + window.innerHeight) {
      tooltipTop = targetRect.top - 160 - PADDING;
    }
  } else {
    // Center on screen as fallback
    tooltipTop = window.scrollY + window.innerHeight / 2 - 80;
    tooltipLeft = window.innerWidth / 2 - 160;
  }

  return (
    <>
      {/* Dim overlay */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 pointer-events-auto"
        onClick={onDone}
        aria-hidden="true"
      />

      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="fixed z-[9999] rounded-xl ring-4 ring-indigo-500 ring-offset-2 pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - PADDING,
            left: targetRect.left - PADDING,
            width: targetRect.width + PADDING * 2,
            height: targetRect.height + PADDING * 2,
          }}
          aria-hidden="true"
        />
      )}

      {/* Tooltip card */}
      <div
        role="dialog"
        aria-label={`Feature tour step ${currentStep + 1} of ${TOUR_STEPS.length}: ${step.title}`}
        className="fixed z-[10000] w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 pointer-events-auto"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {step.title}
            </h3>
          </div>
          <button
            onClick={onDone}
            aria-label="Close tour"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
          {step.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            onClick={onDone}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            Skip tour
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
}
