// src/components/HomePage.jsx
import React from 'react';
import { AlertTriangle, MapPin, BarChart3, ChevronRight, Activity } from 'lucide-react';

const HomePage = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Fondo Gradiente */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-black z-0"></div>
      
      <div className="max-w-7xl w-full z-10 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN */}
        <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-full text-red-400 animate-pulse">
                <AlertTriangle size={16} />
                <span className="text-xs font-bold tracking-wider uppercase">Alerta Vial Activa</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black leading-tight">
                Crisis Vial <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Ruta Cito-Zarco</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed text-justify border-l-4 border-slate-700 pl-4">
                Plataforma de simulación de impacto económico y logístico del socavamiento en el <strong>Km 194 (El Palmar)</strong>. 
                Analiza en tiempo real el costo de oportunidad, colas de espera y riesgos de accidentes bajo diferentes condiciones climáticas.
            </p>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <h3 className="text-2xl font-bold text-white">Q1.8M</h3>
                    <p className="text-xs text-slate-400 uppercase">Pérdidas Diarias Est.</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <h3 className="text-2xl font-bold text-white">60%</h3>
                    <p className="text-xs text-slate-400 uppercase">Reducción Capacidad</p>
                </div>
            </div>

            <button 
                onClick={onStart}
                className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:-translate-y-1"
            >
                Entrar al Simulador
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>

        {/* COLUMNA DERECHA: MAPA */}
        <div className="relative h-[500px] w-full bg-slate-800 rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl group">
            {/* Header del Mapa estilo "Comando" */}
            <div className="absolute top-0 left-0 w-full bg-slate-900/90 backdrop-blur text-xs text-slate-400 p-2 flex justify-between items-center z-10 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-emerald-500 animate-pulse"/>
                    <span className="font-mono">LIVE FEED: KM 194 EL PALMAR</span>
                </div>
                <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>14.6738° N, 91.5976° W</span>
                </div>
            </div>

            {/* IFRAME GOOGLE MAPS */}
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15428.677569941323!2d-91.5976214046522!3d14.673824584347576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x858e7230489069d5%3A0x6734346067087661!2sEl%20Palmar!5e0!3m2!1ses!2sgt!4v1701380000000!5m2!1ses!2sgt&maptype=satellite" 
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen="" 
                loading="lazy" 
                className="opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                referrerPolicy="no-referrer-when-downgrade">
            </iframe>

            {/* Overlay Decorativo sobre el mapa */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
        </div>

      </div>
      
      <div className="absolute bottom-4 text-slate-600 text-xs text-center w-full">
          Proyecto de Modelación y Simulación 2025 - Ingeniería de Sistemas USAC
      </div>
    </div>
  );
};

export default HomePage;