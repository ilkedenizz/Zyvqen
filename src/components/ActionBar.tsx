import './ActionBar.css';

interface ActionBarProps {
  onGenerate: () => void;
  onExport: () => void;
  canGenerate: boolean;
  canExport: boolean;
}

export function ActionBar({ onGenerate, onExport, canGenerate, canExport }: ActionBarProps) {
  return (
    <div className="action-bar">
      <button 
        className="button-primary generate-btn" 
        onClick={onGenerate}
        disabled={!canGenerate}
      >
        Generate Sprite Sheet
      </button>
      <button 
        className="button-secondary" 
        onClick={onExport}
        disabled={!canExport}
      >
        Export PNG
      </button>
    </div>
  );
}
