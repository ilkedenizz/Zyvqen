import './PreviewPanel.css';

export function PreviewPanel() {
  return (
    <div className="panel preview-panel">
      <div className="preview-header">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>Preview</h2>
      </div>
      
      <div className="preview-workspace">
        <div className="preview-empty-state">
          <p className="empty-text">No sprite loaded</p>
        </div>
        {/* Canvas will be injected here later */}
      </div>
    </div>
  );
}
