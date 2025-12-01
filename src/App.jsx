// src/App.jsx
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import ComparativeView from './components/ComparativeView';
import HomePage from './components/HomePage'; // Asumo que este archivo existe como en tu version anterior
import { LayoutDashboard, SplitSquareHorizontal, LogOut } from 'lucide-react';

function App() {
  const [mainView, setMainView] = useState('HOME'); // 'HOME' | 'APP'
  const [simView, setSimView] = useState('single'); // 'single' | 'compare'

  // Si estamos en HOME, mostramos la portada
  if (mainView === 'HOME') {
    return <HomePage onStart={() => setMainView('APP')} />;
  }

  // Si no, mostramos la aplicación con la navegación
  return (
    <div className="min-h-screen bg-slate-100">
      
      {/* BARRA DE NAVEGACIÓN SUPERIOR */}
      <nav className="bg-slate-900 text-white px-6 py-3 shadow-lg flex justify-between items-center sticky top-0 z-50">
          <div className="font-bold text-lg tracking-wider">SIMULADOR <span className="text-indigo-400">CITO-ZARCO</span></div>
          
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
              <button 
                  onClick={() => setSimView('single')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${simView === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                  <LayoutDashboard size={16}/> Simulación Detallada
              </button>
              <button 
                  onClick={() => setSimView('compare')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${simView === 'compare' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
                  <SplitSquareHorizontal size={16}/> Comparativa Real
              </button>
          </div>

          <button 
            onClick={() => { setMainView('HOME'); setSimView('single'); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 hover:bg-red-700 text-red-200 hover:text-white text-xs font-bold rounded border border-red-800 transition-colors"
          >
            <LogOut size={14}/> Salir al Inicio
          </button>
      </nav>

      {/* CONTENIDO (Dashboard o Comparativa) */}
      {simView === 'single' ? <Dashboard /> : <ComparativeView />}

    </div>
  );
}

export default App;