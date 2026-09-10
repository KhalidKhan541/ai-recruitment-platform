import React, { useRef, useState } from 'react';

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  onFiles?: (files: File[]) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024,
  onFiles,
  className = '',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (files: File[]): File[] => {
    const valid: File[] = [];
    for (const f of files) {
      if (f.size > maxSize) {
        setError(`File "${f.name}" exceeds max size of ${Math.round(maxSize / 1024 / 1024)}MB`);
      } else {
        valid.push(f);
      }
    }
    return valid;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = validate(Array.from(e.dataTransfer.files));
    if (files.length) onFiles?.(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = validate(Array.from(e.target.files || []));
    if (files.length) onFiles?.(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
        dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <svg className="h-10 w-10 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <p className="text-sm text-slate-600 mb-1">
        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-slate-400">
        {accept ? `Accepted: ${accept}` : 'All files accepted'} (Max {Math.round(maxSize / 1024 / 1024)}MB)
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};
