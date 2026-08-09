import type { ImageDimensions } from '../App';
import './PreviewPanel.css';

interface PreviewPanelProps {
  file: File | null;
  imageUrl: string | null;
  dimensions: ImageDimensions | null;
}

export function PreviewPanel({ file, imageUrl, dimensions }: PreviewPanelProps) {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div className="panel preview-panel">
      <div className="preview-header">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>Preview</h2>
        {file && dimensions && (
          <div className="preview-metadata">
            <span className="metadata-item" title={file.name}>{file.name}</span>
            <span className="metadata-separator">•</span>
            <span className="metadata-item">{dimensions.width} × {dimensions.height} px</span>
            <span className="metadata-separator">•</span>
            <span className="metadata-item">{formatBytes(file.size)}</span>
          </div>
        )}
      </div>
      
      <div className="preview-workspace">
        {!imageUrl ? (
          <div className="preview-empty-state">
            <p className="empty-text">No sprite loaded</p>
          </div>
        ) : (
          <div className="preview-image-container">
            <img src={imageUrl} alt="Sprite Preview" className="preview-image" />
          </div>
        )}
        {/* Canvas will be injected here later */}
      </div>
    </div>
  );
}
