import { useState, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import './UploadZone.css';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  onClearFile: () => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function UploadZone({ onFileSelect, currentFile, onClearFile }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Invalid file type. Only PNG, JPG, and WebP are allowed.');
      return;
    }
    onFileSelect(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
    // reset input value so selecting the same file again works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  return (
    <div className="upload-container">
      <div 
        className={`upload-dropzone ${isDragOver ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="dropzone-content">
          <div className="upload-icon">{currentFile ? '✅' : '📁'}</div>
          <div className="upload-text-group">
            <p className="upload-text">
              {currentFile ? 'Sprite loaded successfully' : 'Drop your sprite here'}
            </p>
            <p className="upload-hint">Supports PNG, JPG, and WebP</p>
          </div>
          <div className="upload-actions">
            <input 
              type="file" 
              ref={fileInputRef}
              hidden
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
            />
            {currentFile ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="button-secondary" onClick={onClearFile}>Clear</button>
                <button className="button-primary" onClick={() => fileInputRef.current?.click()}>
                  Replace sprite
                </button>
              </div>
            ) : (
              <button className="button-primary" onClick={() => fileInputRef.current?.click()}>
                Browse files
              </button>
            )}
          </div>
        </div>
      </div>
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}
