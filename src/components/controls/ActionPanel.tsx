import './ActionPanel.css';

export function ActionPanel() {
  return (
    <div className="action-panel">
      <button className="button-primary generate-btn">Generate Sprite Sheet</button>
      <button className="button-secondary" disabled>Export PNG</button>
    </div>
  );
}
