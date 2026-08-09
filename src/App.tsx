import { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SettingsPanel } from './components/SettingsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ActionBar } from './components/ActionBar';
import './App.css';

function App() {
  // Simple state to toggle between upload view and editor view for UI testing
  const [hasFiles, setHasFiles] = useState(false);

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        {!hasFiles ? (
          <div onClick={() => setHasFiles(true)} style={{ cursor: 'pointer' }}>
            <UploadZone />
          </div>
        ) : (
          <div className="workspace-view">
            <div className="workspace-grid">
              <aside className="workspace-sidebar">
                <SettingsPanel />
              </aside>
              <section className="workspace-main">
                <PreviewPanel />
              </section>
            </div>
            <ActionBar />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
