import React, { useState, useRef, useEffect } from 'react';

interface RangeSliderProps {
  min?: number;
  max?: number;
  value?: [number, number];
  onChange?: (value: [number, number]) => void;
  step?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min = 0,
  max = 100,
  value: controlledValue,
  onChange,
  step = 1,
  label,
  showValue = true,
  className = '',
}) => {
  const [internal, setInternal] = useState<[number, number]>(controlledValue || [min, max]);
  const value = controlledValue ?? internal;

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);

  const getPercent = (v: number) => ((v - min) / (max - min)) * 100;

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + pct * (max - min);
    const snapped = Math.round(raw / step) * step;

    if (dragging === 'min') {
      onChange?.([Math.min(snapped, value[1] - step), value[1]]);
      setInternal((p) => [Math.min(snapped, p[1] - step), p[1]]);
    } else {
      onChange?.([value[0], Math.max(snapped, value[0] + step)]);
      setInternal((p) => [p[0], Math.max(snapped, p[0] + step)]);
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(null);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [dragging, value]);

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
          {showValue && <span className="text-sm text-slate-500">{value[0]} - {value[1]}</span>}
        </div>
      )}
      <div ref={trackRef} className="relative h-2 bg-slate-200 rounded-full">
        <div
          className="absolute h-full bg-blue-600 rounded-full"
          style={{ left: `${getPercent(value[0])}%`, right: `${100 - getPercent(value[1])}%` }}
        />
        <button
          onMouseDown={() => setDragging('min')}
          onTouchStart={() => setDragging('min')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 bg-white border-2 border-blue-600 rounded-full shadow cursor-grab active:cursor-grabbing"
          style={{ left: `${getPercent(value[0])}%` }}
        />
        <button
          onMouseDown={() => setDragging('max')}
          onTouchStart={() => setDragging('max')}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 bg-white border-2 border-blue-600 rounded-full shadow cursor-grab active:cursor-grabbing"
          style={{ left: `${getPercent(value[1])}%` }}
        />
      </div>
    </div>
  );
};
