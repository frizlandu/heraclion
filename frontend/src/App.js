// frontend/src/App.js
import React from 'react';
import AppRouter from './router/AppRouter';
import RenderStatusWidget from './components/RenderStatusWidget';
import './App.css';

function App() {
  return (
    <div>
      <header style={styles.header}>
        <h1>🧪 HERACLION Render Monitor</h1>
        <RenderStatusWidget />
      </header>
      <main>
        <AppRouter />
      </main>
    </div>
  );
}

const styles = {
  header: {
    padding: '16px',
    backgroundColor: '#f0f0f0',
    borderBottom: '1px solid #ccc'
  }
};

export default App;
