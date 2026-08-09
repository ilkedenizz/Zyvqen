import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SettingsPanel } from './components/SettingsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ActionBar } from './components/ActionBar';
import './App.css';

export interface ImageDimensions {
  width: number;
  height: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);

  const handleFileSelect = (newFile: File) => {
    // Revoke old URL if exists
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    
    const url = URL.createObjectURL(newFile);
    setFile(newFile);
    setImageUrl(url);

    // Get dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = url;
  };

  const handleClearFile = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setFile(null);
    setImageUrl(null);
    setImageDimensions(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <UploadZone 
          onFileSelect={handleFileSelect} 
          currentFile={file}
          onClearFile={handleClearFile}
        />
        
        <div className="workspace-view">
          <div className="workspace-grid">
            <aside className="workspace-sidebar">
              <SettingsPanel />
            </aside>
            <section className="workspace-main">
              <PreviewPanel 
                file={file} 
                imageUrl={imageUrl} 
                dimensions={imageDimensions} 
              />
            </section>
          </div>
          <ActionBar />
        </div>
      </main>
    </div>
  );
}

export default App;
