import React, { useState } from 'react';

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  error?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  min,
  max,
  error,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const selectDate = (day: number) => {
    const d = new Date(year, month, day);
    onChange?.(d);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-slate-300'
        }`}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value ? value.toLocaleDateString() : placeholder}
        </span>
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white rounded-xl border border-slate-200 shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1 hover:bg-slate-100 rounded">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium">{monthNames[month]} {year}</span>
            <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1 hover:bg-slate-100 rounded">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) =>
              day === null ? <div key={i} /> : (
                <button
                  key={i}
                  onClick={() => selectDate(day)}
                  className={`h-8 w-8 rounded-lg text-sm ${
                    value?.getFullYear() === year && value?.getMonth() === month && value?.getDate() === day
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
