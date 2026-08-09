import './UploadZone.css';

export function UploadZone() {
  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1 className="upload-title">Sprite Sheet Maker</h1>
        <p className="upload-subtitle">Turn your sprites into game-ready sheets.</p>
      </div>
      
      <div className="upload-dropzone">
        <div className="dropzone-content">
          <div className="upload-icon">📁</div>
          <div className="upload-text-group">
            <p className="upload-text">Drop your sprite here</p>
            <p className="upload-hint">Supports PNG, JPG, and WebP</p>
          </div>
          <div className="upload-actions">
            <button className="button-primary">Browse files</button>
          </div>
        </div>
      </div>
    </div>
  );
}
