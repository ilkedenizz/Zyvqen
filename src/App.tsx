
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { SettingsPanel } from './components/SettingsPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ActionBar } from './components/ActionBar';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      
      <main className="main-content">
        <UploadZone />
        
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
      </main>
    </div>
  );
}

export default App;
