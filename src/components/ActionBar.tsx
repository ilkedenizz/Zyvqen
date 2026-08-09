import './ActionBar.css';

export function ActionBar() {
  return (
    <div className="action-bar">
      <button className="button-primary generate-btn">Generate Sprite Sheet</button>
      <button className="button-secondary" disabled>Export PNG</button>
    </div>
  );
}
