import { useState } from 'react';
import './Header.css';

export function Header() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-group">
          <span className="brand-name">Zyvqen</span>
          <span className="separator">/</span>
          <span className="tool-name">Sprite Sheet Maker</span>
        </div>
      </div>
      <div className="header-right">
        <nav className="header-nav">
          <button className="nav-item">Tools</button>
        </nav>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
