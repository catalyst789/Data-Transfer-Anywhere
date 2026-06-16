import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFiles, disabled }: Props) {
  const onDrop = useCallback((accepted: File[]) => onFiles(accepted), [onFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-indigo-400 bg-indigo-950' : 'border-zinc-600 hover:border-zinc-400'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <p className="text-4xl mb-3">📂</p>
      <p className="text-zinc-300 text-sm">
        {isDragActive ? 'Drop files here…' : 'Drag & drop files, or click to select'}
      </p>
      <p className="text-zinc-500 text-xs mt-1">Any file type · Any size</p>
    </div>
  );
}
