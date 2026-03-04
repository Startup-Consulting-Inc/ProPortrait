import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ComparisonSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function ComparisonSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Original',
  afterLabel = 'AI Portrait',
}: ComparisonSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, updatePosition]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setPosition(p => Math.max(0, p - 5));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setPosition(p => Math.min(100, p + 5));
        break;
      case 'Home':
        e.preventDefault();
        setPosition(0);
        break;
      case 'End':
        e.preventDefault();
        setPosition(100);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl select-none cursor-col-resize bg-slate-900"
      onMouseDown={(e) => { setIsDragging(true); updatePosition(e.clientX); }}
      onTouchStart={(e) => updatePosition(e.touches[0].clientX)}
      onTouchMove={(e) => updatePosition(e.touches[0].clientX)}
    >
      {/* Before (Original) — always visible, bottom layer */}
      <img
        src={beforeSrc}
        alt={beforeLabel}
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
        referrerPolicy="no-referrer"
      />

      {/* After (AI Portrait) — top layer, revealed from right */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={afterSrc}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] z-10 pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Keyboard-accessible handle */}
        <div
          tabIndex={0}
          role="slider"
          aria-label="Compare original and AI portrait"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)}% AI portrait revealed`}
          onKeyDown={handleKeyDown}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center pointer-events-auto cursor-col-resize focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M6 9H4M4 9L6 7M4 9L6 11M12 9H14M14 9L12 7M14 9L12 11" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-sm">
        {beforeLabel}
      </div>
      <div className="absolute bottom-3 right-3 bg-indigo-600/80 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-sm">
        {afterLabel}
      </div>

      {/* Hint */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none backdrop-blur-sm whitespace-nowrap">
        Drag or use arrow keys to compare
      </div>
    </div>
  );
}
