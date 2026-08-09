import type { ImageDimensions, GridSettings } from '../App';
import { AnimationPreview } from './AnimationPreview';
import './PreviewPanel.css';

interface PreviewPanelProps {
  file: File | null;
  imageUrl: string | null;
  dimensions: ImageDimensions | null;
  gridSettings?: GridSettings;
  generatedImageUrl?: string | null;
  previewTab?: 'source' | 'output';
  onTabChange?: (tab: 'source' | 'output') => void;
}

export function PreviewPanel({ 
  file, 
  imageUrl, 
  dimensions, 
  gridSettings, 
  generatedImageUrl, 
  previewTab = 'source', 
  onTabChange 
}: PreviewPanelProps) {
  
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  let totalFrames = 0;
  let frameWidth = 0;
  let frameHeight = 0;
  
  if (dimensions && gridSettings) {
    const { columns, rows, padding, spacing, offsetX, offsetY } = gridSettings;
    totalFrames = columns * rows;
    frameWidth = Math.floor((dimensions.width - offsetX - padding * 2 - spacing * (columns - 1)) / columns);
    frameHeight = Math.floor((dimensions.height - offsetY - padding * 2 - spacing * (rows - 1)) / rows);
  }

  const renderGridOverlay = () => {
    if (!dimensions || !gridSettings) return null;
    const { columns, rows, padding, spacing, offsetX, offsetY } = gridSettings;
    
    // Convert to percentages relative to original image size
    const pX = ((offsetX + padding) / dimensions.width) * 100;
    const pY = ((offsetY + padding) / dimensions.height) * 100;
    const sX = (spacing / dimensions.width) * 100;
    const sY = (spacing / dimensions.height) * 100;
    const fw = (frameWidth / dimensions.width) * 100;
    const fh = (frameHeight / dimensions.height) * 100;

    const frames = [];
    let count = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const left = pX + c * (fw + sX);
        const top = pY + r * (fh + sY);
        
        frames.push(
          <div 
            key={`${r}-${c}`}
            className="grid-overlay-cell"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${fw}%`,
              height: `${fh}%`
            }}
          >
            <span className="grid-overlay-number">{count}</span>
          </div>
        );
        count++;
      }
    }

    return <div className="grid-overlay">{frames}</div>;
  };

  return (
    <div className="panel preview-panel">
      <div className="preview-header">
        <div className="preview-title-group">
          <h2 className="panel-title" style={{ marginBottom: 0 }}>Preview</h2>
          {generatedImageUrl && onTabChange && (
            <div className="preview-tabs">
              <button 
                className={`tab-btn ${previewTab === 'source' ? 'active' : ''}`}
                onClick={() => onTabChange('source')}
              >
                Source
              </button>
              <button 
                className={`tab-btn ${previewTab === 'output' ? 'active' : ''}`}
                onClick={() => onTabChange('output')}
              >
                Output
              </button>
            </div>
          )}
        </div>
        
        {file && dimensions && (
          <div className="preview-metadata-container">
            <div className="preview-metadata">
              <span className="metadata-item" title={file.name}>{file.name}</span>
              <span className="metadata-separator">•</span>
              <span className="metadata-item">{dimensions.width} × {dimensions.height} px</span>
              <span className="metadata-separator">•</span>
              <span className="metadata-item">{formatBytes(file.size)}</span>
            </div>
            {totalFrames > 0 && frameWidth > 0 && frameHeight > 0 && previewTab === 'source' && (
              <div className="preview-metadata grid-metadata">
                <span className="metadata-item highlighted">{totalFrames} frames</span>
                <span className="metadata-separator">•</span>
                <span className="metadata-item">{frameWidth} × {frameHeight} px per frame</span>
              </div>
            )}
            {previewTab === 'output' && (
              <div className="preview-metadata grid-metadata">
                <span className="metadata-item success-text">{totalFrames} frames generated</span>
              </div>
            )}
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
            {previewTab === 'source' ? (
              <div className="image-wrapper">
                <img src={imageUrl} alt="Sprite Source" className="preview-image" />
                {renderGridOverlay()}
              </div>
            ) : (
              <div className="output-preview-container">
                <div className="image-wrapper">
                  <img src={generatedImageUrl || ''} alt="Sprite Output" className="preview-image output-image" />
                </div>
                {generatedImageUrl && totalFrames > 0 && frameWidth > 0 && frameHeight > 0 && (
                  <AnimationPreview 
                    generatedImageUrl={generatedImageUrl}
                    totalFrames={totalFrames}
                    frameWidth={frameWidth}
                    frameHeight={frameHeight}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
