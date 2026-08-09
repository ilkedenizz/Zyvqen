import './UploadArea.css';

export function UploadArea() {
  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1 className="upload-title">Sprite Sheet Maker</h1>
        <p className="upload-subtitle">Turn your sprites into game-ready sheets.</p>
      </div>
      
      <div className="upload-dropzone">
        <div className="dropzone-content">
          <div className="upload-icon">📁</div>
          <p className="upload-text">Drag and drop your sprites here</p>
          <p className="upload-hint">Supports PNG, JPG, and WebP</p>
          <div className="upload-actions">
            <button className="button-primary">Browse files</button>
          </div>
        </div>
      </div>
    </div>
  );
}
