import React from 'react';
import '../styles/Header.css';

function Header() {
  return (
    <header className="app-header glass-panel">
      <div className="header-content">
        <div className="logo-container">
          <div className="logo-icon">📅</div>
          <h1>Akıllı Program</h1>
        </div>
        <p className="subtitle">Üniversite & Okul Ders Programı Oluşturucu</p>
      </div>
    </header>
  );
}

export default Header;
