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

export interface GridSettings {
  columns: number;
  rows: number;
  padding: number;
  spacing: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    columns: 4,
    rows: 4,
    padding: 0,
    spacing: 0
  });
  
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'source' | 'output'>('source');

  const handleFileSelect = (newFile: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (generatedImageUrl) {
      URL.revokeObjectURL(generatedImageUrl);
      setGeneratedImageUrl(null);
    }
    
    const url = URL.createObjectURL(newFile);
    setFile(newFile);
    setImageUrl(url);
    setPreviewTab('source');

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = url;
  };

  const handleClearFile = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
    setFile(null);
    setImageUrl(null);
    setImageDimensions(null);
    setGeneratedImageUrl(null);
    setPreviewTab('source');
  };

  const handleGenerate = () => {
    if (!imageUrl || !imageDimensions) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { columns, rows, padding, spacing } = gridSettings;
    const totalFrames = columns * rows;
    
    const frameWidth = (imageDimensions.width - padding * 2 - spacing * (columns - 1)) / columns;
    const frameHeight = (imageDimensions.height - padding * 2 - spacing * (rows - 1)) / rows;
    
    // Bounds check
    if (frameWidth <= 0 || frameHeight <= 0) return;

    // Output Canvas setup - horizontal sprite sheet
    canvas.width = frameWidth * totalFrames;
    canvas.height = frameHeight;

    const img = new Image();
    img.onload = () => {
      let currentFrame = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const sourceX = padding + c * (frameWidth + spacing);
          const sourceY = padding + r * (frameHeight + spacing);
          const destX = currentFrame * frameWidth;
          
          ctx.drawImage(
            img,
            sourceX, sourceY, frameWidth, frameHeight,
            destX, 0, frameWidth, frameHeight
          );
          currentFrame++;
        }
      }
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
        const url = URL.createObjectURL(blob);
        setGeneratedImageUrl(url);
        setPreviewTab('output');
      }, 'image/png');
    };
    img.src = imageUrl;
  };

  const handleExport = () => {
    if (!generatedImageUrl || !file) return;
    const a = document.createElement('a');
    a.href = generatedImageUrl;
    
    const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
    a.download = `${originalName || 'sprite'}-spritesheet.png`;
    a.click();
  };

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      if (generatedImageUrl) URL.revokeObjectURL(generatedImageUrl);
    };
  }, [imageUrl, generatedImageUrl]);

  // Validation
  let gridExceedsBounds = false;
  if (imageDimensions) {
    const { columns, rows, padding, spacing } = gridSettings;
    const totalW = padding * 2 + spacing * (columns - 1) + columns; // min 1px per frame
    const totalH = padding * 2 + spacing * (rows - 1) + rows;
    if (totalW > imageDimensions.width || totalH > imageDimensions.height) {
      gridExceedsBounds = true;
    }
  }

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
              <SettingsPanel 
                gridSettings={gridSettings}
                onSettingsChange={setGridSettings}
                validationError={gridExceedsBounds ? "Grid exceeds image bounds." : null}
              />
            </aside>
            <section className="workspace-main">
              <PreviewPanel 
                file={file} 
                imageUrl={imageUrl} 
                dimensions={imageDimensions}
                gridSettings={gridSettings}
                generatedImageUrl={generatedImageUrl}
                previewTab={previewTab}
                onTabChange={setPreviewTab}
              />
            </section>
          </div>
          <ActionBar 
            onGenerate={handleGenerate}
            onExport={handleExport}
            canGenerate={!!file && !gridExceedsBounds}
            canExport={!!generatedImageUrl}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
