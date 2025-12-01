import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';

function App() {
  const [view, setView] = useState('HOME'); // 'HOME' | 'SIMULATOR'

  return (
    <div>
      {view === 'HOME' ? (
        <HomePage onStart={() => setView('SIMULATOR')} />
      ) : (
        <div className="relative">
          <button
            onClick={() => setView('HOME')}
            className="absolute top-4 right-4 z-50 px-4 py-2 bg-slate-800 text-white text-xs rounded hover:bg-slate-700"
          >
            X Salir al Inicio
          </button>
          <Dashboard />
        </div>
      )}
    </div>
  );
}

export default App;