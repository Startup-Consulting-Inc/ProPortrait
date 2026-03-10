import { useState, useEffect, useRef } from 'react';

interface GenerationProgressProps {
  isGenerating: boolean;
  numVariations: number;
}

const PHASES = [
  { label: 'Analyzing your photo', duration: 8 },
  { label: 'Applying identity locks', duration: 15 },
  { label: 'Generating portrait variants', duration: 30 },
  { label: 'Enhancing details', duration: 15 },
  { label: 'Finalizing', duration: 7 },
] as const;

const TOTAL_DURATION = PHASES.reduce((sum, p) => sum + p.duration, 0); // 75s

export default function GenerationProgress({ isGenerating, numVariations }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isGenerating) {
      // Snap to 100% briefly, then reset
      setProgress(100);
      const t = setTimeout(() => {
        setProgress(0);
        setPhaseIndex(0);
        startTimeRef.current = null;
      }, 600);
      return () => clearTimeout(t);
    }

    startTimeRef.current = Date.now();
    setProgress(0);
    setPhaseIndex(0);

    const tick = () => {
      if (!startTimeRef.current) return;
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      // Fill to 95% over TOTAL_DURATION, then hold
      const raw = Math.min((elapsed / TOTAL_DURATION) * 95, 95);
      setProgress(raw);

      // Determine current phase
      let cumulative = 0;
      for (let i = 0; i < PHASES.length; i++) {
        cumulative += PHASES[i].duration;
        if (elapsed < cumulative) {
          setPhaseIndex(i);
          break;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isGenerating]);

  if (!isGenerating && progress === 0) return null;

  const phase = PHASES[phaseIndex];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Generating portraits: ${phase?.label ?? 'Finalizing'}`}
      className="mt-6 px-2"
    >
      {/* Phase label */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-600 animate-pulse">
          {phase?.label ?? 'Finalizing'}&hellip;
        </p>
        <p className="text-xs text-slate-400">
          {numVariations} portrait{numVariations !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase dots */}
      <div className="flex justify-between mt-2">
        {PHASES.map((p, i) => (
          <div
            key={p.label}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              i <= phaseIndex ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
