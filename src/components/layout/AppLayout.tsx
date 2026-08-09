import { useState } from 'react';
import { Header } from './Header';
import { UploadArea } from '../upload/UploadArea';
import { EditorPanel } from '../editor/EditorPanel';
import { PreviewPanel } from '../preview/PreviewPanel';
import { ActionPanel } from '../controls/ActionPanel';
import './AppLayout.css';

export function AppLayout() {
  // Simple state to toggle between upload view and editor view for UI testing
  const [hasFiles, setHasFiles] = useState(false);

  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        {!hasFiles ? (
          <div className="upload-view" onClick={() => setHasFiles(true)}>
            <UploadArea />
          </div>
        ) : (
          <div className="workspace-view">
            <div className="workspace-grid">
              <aside className="workspace-sidebar">
                <EditorPanel />
              </aside>
              <section className="workspace-main">
                <PreviewPanel />
              </section>
            </div>
            <ActionPanel />
          </div>
        )}
      </main>
    </div>
  );
}
