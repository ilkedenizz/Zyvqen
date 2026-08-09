import { useState, type ChangeEvent } from 'react';
import type { GridSettings } from '../App';
import './SettingsPanel.css';

interface SettingsPanelProps {
  gridSettings: GridSettings;
  onSettingsChange: (settings: GridSettings) => void;
  validationError: string | null;
  imageUrl?: string | null;
}

export function SettingsPanel({ gridSettings, onSettingsChange, validationError, imageUrl }: SettingsPanelProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{
    offsetX: number;
    offsetY: number;
    columns: number;
    rows: number;
    frameWidth: number;
    frameHeight: number;
    confidence: 'High' | 'Medium' | 'Low';
  } | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const handleChange = (field: keyof GridSettings) => (e: ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) val = 0;
    
    // Enforce minimums
    if (field === 'columns' || field === 'rows') {
      val = Math.max(1, val);
    } else {
      val = Math.max(0, val);
    }

    onSettingsChange({
      ...gridSettings,
      [field]: val
    });
  };

  const handleAutoDetect = () => {
    if (!imageUrl) return;
    
    setIsDetecting(true);
    setDetectionError(null);
    setDetectionResult(null);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas 2D context not available");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let minX = canvas.width;
        let minY = canvas.height;
        let maxX = 0;
        let maxY = 0;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (minX > maxX || minY > maxY) {
          throw new Error("Could not detect a reliable grid.");
        }

        let rowsDetected = 0;
        let inContentY = false;
        for (let y = minY; y <= maxY; y++) {
          let rowHasContent = false;
          for (let x = minX; x <= maxX; x++) {
            if (data[(y * canvas.width + x) * 4 + 3] > 10) {
              rowHasContent = true;
              break;
            }
          }
          if (rowHasContent && !inContentY) {
            rowsDetected++;
            inContentY = true;
          } else if (!rowHasContent && inContentY) {
            inContentY = false;
          }
        }

        let colsDetected = 0;
        let inContentX = false;
        for (let x = minX; x <= maxX; x++) {
          let colHasContent = false;
          for (let y = minY; y <= maxY; y++) {
            if (data[(y * canvas.width + x) * 4 + 3] > 10) {
              colHasContent = true;
              break;
            }
          }
          if (colHasContent && !inContentX) {
            colsDetected++;
            inContentX = true;
          } else if (!colHasContent && inContentX) {
            inContentX = false;
          }
        }

        let cols = gridSettings.columns;
        let rows = gridSettings.rows;
        let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

        if (colsDetected > 1 && rowsDetected > 1) {
          cols = colsDetected;
          rows = rowsDetected;
          confidence = 'High';
        }

        const contentWidth = maxX - minX + 1;
        const contentHeight = maxY - minY + 1;
        const expectedFrameWidth = Math.floor(contentWidth / cols);
        const expectedFrameHeight = Math.floor(contentHeight / rows);

        setDetectionResult({
          offsetX: minX,
          offsetY: minY,
          columns: cols,
          rows: rows,
          frameWidth: expectedFrameWidth,
          frameHeight: expectedFrameHeight,
          confidence
        });
      } catch (err) {
        if (err instanceof Error) {
          setDetectionError(err.message || "Could not detect a reliable grid.");
        } else {
          setDetectionError("Could not detect a reliable grid.");
        }
      } finally {
        setIsDetecting(false);
      }
    };
    img.onerror = () => {
      setDetectionError("Could not load image for detection.");
      setIsDetecting(false);
    };
    img.src = imageUrl;
  };

  const handleApplyDetection = () => {
    if (detectionResult) {
      onSettingsChange({
        ...gridSettings,
        offsetX: detectionResult.offsetX,
        offsetY: detectionResult.offsetY,
        columns: detectionResult.columns,
        rows: detectionResult.rows,
      });
      setDetectionResult(null);
    }
  };

  return (
    <div className="panel settings-panel">
      <div className="panel-header-row">
        <h2 className="panel-title">Grid Settings</h2>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={handleAutoDetect}
          disabled={!imageUrl || isDetecting}
        >
          {isDetecting ? 'Detecting...' : 'Auto Detect'}
        </button>
      </div>
      
      {validationError && (
        <div className="settings-error">
          {validationError}
        </div>
      )}

      {detectionError && (
        <div className="settings-error detection-error">
          {detectionError}
        </div>
      )}

      {detectionResult && (
        <div className="detection-result">
          <div className="detection-header">
            <h3>Auto-detected grid</h3>
            <span className={`confidence-badge ${detectionResult.confidence.toLowerCase()}`}>
              Confidence: {detectionResult.confidence}
            </span>
          </div>
          <div className="detection-stats">
            <div className="stat-row"><span>Offset X</span> <strong>{detectionResult.offsetX}</strong></div>
            <div className="stat-row"><span>Offset Y</span> <strong>{detectionResult.offsetY}</strong></div>
            <div className="stat-row"><span>Columns</span> <strong>{detectionResult.columns}</strong></div>
            <div className="stat-row"><span>Rows</span> <strong>{detectionResult.rows}</strong></div>
            <div className="stat-row highlight"><span>Frame size</span> <strong>{detectionResult.frameWidth} &times; {detectionResult.frameHeight} px</strong></div>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleApplyDetection}>
            Apply
          </button>
        </div>
      )}
      
      <div className="settings-group">
        <div className="setting-row">
          <div className="input-group">
            <label className="label">Offset X</label>
            <input 
              type="number" 
              className="input-field" 
              value={gridSettings.offsetX} 
              onChange={handleChange('offsetX')} 
              min={0} 
            />
          </div>
          <div className="input-group">
            <label className="label">Offset Y</label>
            <input 
              type="number" 
              className="input-field" 
              value={gridSettings.offsetY} 
              onChange={handleChange('offsetY')} 
              min={0} 
            />
          </div>
        </div>

        <div className="setting-row">
          <div className="input-group">
            <label className="label">Columns</label>
            <input 
              type="number" 
              className="input-field" 
              value={gridSettings.columns} 
              onChange={handleChange('columns')} 
              min={1} 
            />
          </div>
          <div className="input-group">
            <label className="label">Rows</label>
            <input 
              type="number" 
              className="input-field" 
              value={gridSettings.rows} 
              onChange={handleChange('rows')} 
              min={1} 
            />
          </div>
        </div>

        <div className="setting-row">
          <div className="input-group">
            <label className="label">Padding</label>
            <input 
              type="number" 
              className="input-field" 
              value={gridSettings.padding} 
              onChange={handleChange('padding')} 
              min={0} 
            />
          </div>
          <div className="input-group">
            <label className="label">Spacing</label>
            <input 
              type="number" 
              className="input-field" 
              value={gridSettings.spacing} 
              onChange={handleChange('spacing')} 
              min={0} 
            />
          </div>
        </div>
      </div>

      <h2 className="panel-title" style={{ marginTop: 'var(--spacing-md)' }}>Background</h2>
      <div className="settings-group">
        <div className="bg-options">
          <button className="bg-option active" style={{ backgroundColor: 'transparent', backgroundImage: 'conic-gradient(#ccc 25%, white 25%, white 50%, #ccc 50%, #ccc 75%, white 75%, white)', backgroundSize: '8px 8px' }} aria-label="Transparent"></button>
          <button className="bg-option" style={{ backgroundColor: '#000000' }} aria-label="Black"></button>
          <button className="bg-option" style={{ backgroundColor: '#ffffff' }} aria-label="White"></button>
        </div>
      </div>
    </div>
  );
}
