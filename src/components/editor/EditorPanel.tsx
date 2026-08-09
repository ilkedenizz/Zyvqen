import './EditorPanel.css';

export function EditorPanel() {
  return (
    <div className="panel editor-panel">
      <h2 className="panel-title">Grid Settings</h2>
      
      <div className="settings-group">
        <div className="setting-row">
          <div className="input-group">
            <label className="label">Columns</label>
            <input type="number" className="input-field" defaultValue={4} min={1} />
          </div>
          <div className="input-group">
            <label className="label">Rows</label>
            <input type="number" className="input-field" defaultValue={4} min={1} />
          </div>
        </div>

        <div className="setting-row">
          <div className="input-group">
            <label className="label">Padding (px)</label>
            <input type="number" className="input-field" defaultValue={0} min={0} />
          </div>
          <div className="input-group">
            <label className="label">Spacing (px)</label>
            <input type="number" className="input-field" defaultValue={0} min={0} />
          </div>
        </div>
      </div>

      <h2 className="panel-title" style={{ marginTop: 'var(--spacing-md)' }}>Background</h2>
      <div className="settings-group">
        <div className="bg-options">
          <button className="bg-option active" style={{ backgroundColor: 'transparent', backgroundImage: 'conic-gradient(#ccc 25%, white 25%, white 50%, #ccc 50%, #ccc 75%, white 75%, white)', backgroundSize: '8px 8px' }} aria-label="Transparent"></button>
          <button className="bg-option" style={{ backgroundColor: '#000000' }} aria-label="Black"></button>
          <button className="bg-option" style={{ backgroundColor: '#ffffff' }} aria-label="White"></button>
          <button className="bg-option" style={{ backgroundColor: '#ff00ff' }} aria-label="Magenta"></button>
        </div>
      </div>
    </div>
  );
}
