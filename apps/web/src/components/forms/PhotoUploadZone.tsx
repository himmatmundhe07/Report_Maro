import { useRef, useState, useEffect } from 'react';

export interface PhotoUploadZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number; // default 5MB
}

export default function PhotoUploadZone({
  files,
  onChange,
  maxFiles = 4,
  maxSizeBytes = 5 * 1024 * 1024,
}: PhotoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate object URLs for previews and cleanup on unmount
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    setErrorMsg(null);

    const validNewFiles: File[] = [];
    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles.item(i);
      if (!file) continue;
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files (JPG, PNG, WebP) are allowed');
        continue;
      }
      if (file.size > maxSizeBytes) {
        setErrorMsg(`File ${file.name} exceeds ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit`);
        continue;
      }
      validNewFiles.push(file);
    }

    const merged = [...files, ...validNewFiles].slice(0, maxFiles);
    if (files.length + validNewFiles.length > maxFiles) {
      setErrorMsg(`Maximum ${maxFiles} photos allowed per report`);
    }
    onChange(merged);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-orange-500 text-sm">photo_camera</span>
          Incident Photos ({files.length}/{maxFiles})
        </label>
        <span className="text-[11px] text-slate-400">JPG, PNG, WebP up to 5MB</span>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer select-none text-center ${
          dragActive
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-slate-300 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500/60 bg-slate-50/50 dark:bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/jpg"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 mb-2">
          <span className="material-symbols-outlined text-xl">cloud_upload</span>
        </div>
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
          <span className="text-orange-500 font-semibold underline decoration-orange-300">Click to upload</span> or drag and drop photos
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Attach clear ground-level images to help AI triage and verification
        </p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {previews.map((url, idx) => (
            <div
              key={idx}
              className="group relative h-24 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm"
            >
              <img
                src={url}
                alt={`Incident preview ${idx + 1}`}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                title="Remove image"
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
              <span className="absolute bottom-1 left-1.5 text-[10px] font-medium text-white/90 drop-shadow">
                Photo {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <p className="text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">warning</span>
          {errorMsg}
        </p>
      )}
    </div>
  );
}
