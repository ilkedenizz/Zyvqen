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

        const W = maxX - minX + 1;
        const H = maxY - minY + 1;

        const colSums = new Float32Array(W);
        const rowSums = new Float32Array(H);

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 10) {
              colSums[x - minX] += 1;
              rowSums[y - minY] += 1;
            }
          }
        }

        const detectAxis = (sums: Float32Array, length: number, minCoord: number) => {
          const totalPixels = sums.reduce((a, b) => a + b, 0);
          if (totalPixels === 0) return null;

          const candidates = [];
          for (let f = 8; f <= length; f++) {
            const proj = new Float32Array(f);
            for (let i = 0; i < length; i++) {
              proj[i % f] += sums[i];
            }

            let minVal = proj[0];
            for (let k = 1; k < f; k++) {
              if (proj[k] < minVal) minVal = proj[k];
            }

            const minIndices = [];
            for (let k = 0; k < f; k++) {
              if (proj[k] === minVal) minIndices.push(k);
            }
            const gapK = minIndices[Math.floor(minIndices.length / 2)];

            const expected = totalPixels / f;
            const score = expected > 0 ? (minVal / expected) + (f / length) * 0.2 : Infinity;
            candidates.push({ f, score, gapK, minVal, expected });
          }

          if (candidates.length === 0) return null;
          candidates.sort((a, b) => a.score - b.score);
          const best = candidates[0];
          
          const secondBest = candidates.find(c => Math.abs(c.f - best.f) > best.f * 0.2);
          const margin = secondBest ? (secondBest.score - best.score) : Infinity;

          let offset = minCoord + best.gapK;
          if (best.gapK > 0) {
            offset -= best.f;
          }

          const count = Math.ceil((minCoord + length - offset) / best.f);

          return {
            frameSize: best.f,
            offset: offset,
            count: count,
            margin: margin,
            score: best.score
          };
        };

        const resX = detectAxis(colSums, W, minX);
        const resY = detectAxis(rowSums, H, minY);

        if (!resX || !resY) {
          throw new Error("Could not detect a reliable grid.");
        }

        let finalColumns = resX.count;
        let finalRows = resY.count;
        let finalOffsetX = resX.offset;
        let finalOffsetY = resY.offset;
        let finalFrameWidth = resX.frameSize;
        let finalFrameHeight = resY.frameSize;
        let confidence: 'High' | 'Medium' | 'Low' = 'High';

        const minMargin = Math.min(resX.margin, resY.margin);
        const maxScore = Math.max(resX.score, resY.score);

        if (minMargin > 0.05 && maxScore < 0.1) {
            confidence = 'High';
        } else if (minMargin > 0.02 && maxScore < 0.2) {
            confidence = 'Medium';
        } else {
            confidence = 'Low';
        }

        if (confidence === 'Low') {
            finalColumns = gridSettings.columns;
            finalRows = gridSettings.rows;
            finalOffsetX = minX;
            finalOffsetY = minY;
            finalFrameWidth = Math.floor(W / finalColumns);
            finalFrameHeight = Math.floor(H / finalRows);
        }

        setDetectionResult({
          offsetX: finalOffsetX,
          offsetY: finalOffsetY,
          columns: finalColumns,
          rows: finalRows,
          frameWidth: finalFrameWidth,
          frameHeight: finalFrameHeight,
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
            />
          </div>
          <div className="input-group">
            <label className="label">Offset Y</label>
            <input 
              type="number" 
              className="input-field" 
              value={gridSettings.offsetY} 
              onChange={handleChange('offsetY')} 
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
