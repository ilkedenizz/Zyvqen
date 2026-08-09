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

        const colSums = new Float32Array(canvas.width);
        const rowSums = new Float32Array(canvas.height);

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 10) {
              colSums[x] += 1;
              rowSums[y] += 1;
            }
          }
        }

        const computeDistToContent = (sums: Float32Array, len: number) => {
          const dist = new Int32Array(len);
          let last = -999999;
          for (let i = 0; i < len; i++) {
            if (sums[i] > 0) last = i;
            dist[i] = i - last;
          }
          last = 999999;
          for (let i = len - 1; i >= 0; i--) {
            if (sums[i] > 0) last = i;
            dist[i] = Math.min(dist[i], last - i);
          }
          return dist;
        };

        const computePrefixSums = (sums: Float32Array, len: number) => {
          const prefix = new Float32Array(len + 1);
          for (let i = 0; i < len; i++) {
            prefix[i + 1] = prefix[i] + sums[i];
          }
          return prefix;
        };

        const distX = computeDistToContent(colSums, canvas.width);
        const distY = computeDistToContent(rowSums, canvas.height);
        const prefixX = computePrefixSums(colSums, canvas.width);
        const prefixY = computePrefixSums(rowSums, canvas.height);

        const analyzeAxis = (sums: Float32Array, distToContent: Int32Array, prefixSums: Float32Array, W_full: number, spanStart: number, spanEnd: number, maxC: number) => {
          const span = spanEnd - spanStart + 1;
          const totalPixels = sums.reduce((a, b) => a + b, 0);
          const bestResults = []; 

          for (let c = 1; c <= maxC; c++) {
            let bestFw = 0;
            let bestOffset = 0;
            let bestScore = Infinity;

            const minFw = Math.max(4, Math.floor(span / c));
            const maxFw = Math.floor(W_full / c);

            if (minFw > maxFw) continue;
            const tolerance = 5;

            for (let fw = minFw; fw <= maxFw; fw++) {
              const minOffset = Math.max(0, spanEnd - c * fw + 1 - tolerance);
              const maxOffset = Math.min(spanStart + tolerance, W_full - c * fw);

              if (minOffset > maxOffset) continue;

              for (let offset = minOffset; offset <= maxOffset; offset++) {
                let cutPixels = 0;
                let gapReward = 0;

                for (let k = 0; k <= c; k++) {
                  const gx = offset + k * fw;
                  
                  if (k > 0 && k < c) {
                    const margin = distToContent[gx] || 0;
                    if (margin > 0) {
                      gapReward += 1000 + margin * 100;
                    }
                  }

                  for (let dx = -1; dx <= 1; dx++) {
                    const x = gx + dx;
                    if (x >= 0 && x < W_full) {
                      cutPixels += sums[x];
                    }
                  }
                }

                let emptyFrames = 0;
                for (let k = 0; k < c; k++) {
                  const fStart = offset + k * fw;
                  const fEnd = offset + (k + 1) * fw;
                  const endIdx = Math.min(W_full, fEnd);
                  const startIdx = Math.max(0, fStart);
                  const content = prefixSums[endIdx] - prefixSums[startIdx];
                  if (content < totalPixels * 0.005 / c) {
                    emptyFrames++;
                  }
                }

                let score = (cutPixels / totalPixels) * 200000;
                score -= gapReward;
                score += emptyFrames * 5000;
                score += c * 200; 

                if (score < bestScore) {
                  bestScore = score;
                  bestFw = fw;
                  bestOffset = offset;
                }
              }
            }

            if (bestScore !== Infinity) {
              bestResults.push({ c, fw: bestFw, offset: bestOffset, score: bestScore });
            }
          }

          bestResults.sort((a, b) => a.score - b.score);
          return bestResults;
        };

        const resX = analyzeAxis(colSums, distX, prefixX, canvas.width, minX, maxX, 12);
        const resY = analyzeAxis(rowSums, distY, prefixY, canvas.height, minY, maxY, 12);

        if (resX.length === 0 || resY.length === 0) {
          throw new Error("Could not detect a reliable grid.");
        }

        const bestX = resX[0];
        const bestY = resY[0];
        
        const diffX = resX.find(r => r.c !== bestX.c);
        const diffY = resY.find(r => r.c !== bestY.c);

        const marginX = diffX ? (diffX.score - bestX.score) : Infinity;
        const marginY = diffY ? (diffY.score - bestY.score) : Infinity;

        let confidence: 'High' | 'Medium' | 'Low' = 'Low';
        const maxScore = Math.max(bestX.score, bestY.score);
        const minScoreMargin = Math.min(marginX, marginY);

        if (maxScore < 0) {
            if (minScoreMargin > 500) {
                confidence = 'High';
            } else if (minScoreMargin > 100) {
                confidence = 'Medium';
            }
        }

        let finalColumns = bestX.c;
        let finalRows = bestY.c;
        let finalOffsetX = bestX.offset;
        let finalOffsetY = bestY.offset;
        let finalFrameWidth = bestX.fw;
        let finalFrameHeight = bestY.fw;

        if (confidence === 'Low') {
            finalColumns = gridSettings.columns;
            finalRows = gridSettings.rows;
            finalOffsetX = minX;
            finalOffsetY = minY;
            finalFrameWidth = Math.floor((maxX - minX + 1) / finalColumns);
            finalFrameHeight = Math.floor((maxY - minY + 1) / finalRows);
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
