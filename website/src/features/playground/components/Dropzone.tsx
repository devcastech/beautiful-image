import { useDropzone } from 'react-dropzone';

interface DropzoneProps {
  onFile: (file: File) => void;
}

export function Dropzone({ onFile }: DropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: (accepted) => {
      if (accepted[0]) onFile(accepted[0]);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`pg-dropzone${isDragActive ? ' is-active' : ''}${isDragReject ? ' is-reject' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="pg-dropzone__icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L5 21" />
        </svg>
      </div>
      <p className="pg-dropzone__title">
        {isDragReject ? 'That file is not an image' : isDragActive ? 'Drop to optimize' : 'Drop an image here'}
      </p>
      <p className="pg-dropzone__hint">or click to browse · JPG, PNG, WebP · stays on your device</p>
    </div>
  );
}
