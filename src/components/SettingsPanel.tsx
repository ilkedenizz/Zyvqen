import { type ChangeEvent } from 'react';
import type { GridSettings } from '../App';
import './SettingsPanel.css';

interface SettingsPanelProps {
  gridSettings: GridSettings;
  onSettingsChange: (settings: GridSettings) => void;
  validationError: string | null;
}

export function SettingsPanel({ gridSettings, onSettingsChange, validationError }: SettingsPanelProps) {
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

  return (
    <div className="panel settings-panel">
      <div className="panel-header-row">
        <h2 className="panel-title">Grid Settings</h2>
        <button 
          className="btn btn-secondary btn-sm" 
          disabled={true}
          title="Auto Detect — Coming soon"
        >
          Auto Detect (Coming Soon)
        </button>
      </div>
      
      {validationError && (
        <div className="settings-error">
          {validationError}
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

