import './PreviewPanel.css';

export function PreviewPanel() {
  return (
    <div className="panel preview-panel">
      <div className="preview-header">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>Preview</h2>
        <span className="preview-info">0 x 0 px</span>
      </div>
      
      <div className="preview-workspace">
        <div className="preview-empty-state">
          <div className="empty-icon">🖼️</div>
          <p className="empty-text">No sprites loaded</p>
          <p className="empty-hint">Upload images to see the preview</p>
        </div>
        {/* Canvas will be injected here later */}
      </div>
    </div>
  );
}
