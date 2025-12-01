// /src/components/HomePage.jsx
import React from 'react';
import { AlertTriangle, MapPin, Activity } from 'lucide-react';

const HomePage = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <div className="container mx-auto px-6 py-12">
        
        {/* Header Hero */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-block p-3 bg-red-600 rounded-full mb-4 animate-bounce">
            <AlertTriangle size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            Crisis Vial: Socavamiento Km 194
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Plataforma de modelación y simulación de impacto económico en la Ruta Cito-Zarco. 
            Análisis de tráfico, costos logísticos y escenarios de riesgo.
          </p>
          <button 
            onClick={onStart}
            className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all transform hover:scale-105"
          >
            Entrar al Simulador
          </button>
        </div>

        {/* Grid Informativo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Columna Texto */}
          <div className="space-y-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-red-400">
                <Activity /> Situación Actual
              </h2>
              <p className="text-slate-300 leading-relaxed text-justify">
                Las intensas lluvias y la saturación de suelos volcánicos han provocado un socavamiento 
                severo en la Finca La Soledad, El Palmar. Este evento ha inhabilitado un carril completo, 
                obligando a las autoridades a implementar un paso regulado reversible que genera colas de 
                hasta 3 horas, afectando el comercio entre Quetzaltenango y Retalhuleu.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-800 p-4 rounded-lg text-center">
                 <h3 className="text-3xl font-bold text-yellow-400">60%</h3>
                 <p className="text-sm text-slate-400">Reducción de Capacidad</p>
               </div>
               <div className="bg-slate-800 p-4 rounded-lg text-center">
                 <h3 className="text-3xl font-bold text-red-400">Q1.8M</h3>
                 <p className="text-sm text-slate-400">Pérdidas Diarias Est.</p>
               </div>
            </div>
          </div>

          {/* Columna Mapa */}
          <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 h-96 relative shadow-2xl">
            <div className="absolute top-4 left-4 z-10 bg-white/90 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <MapPin size={12}/> Ubicación Exacta
            </div>
            {/* Iframe de Google Maps apuntando a El Palmar / Km 194 aprox */}
            <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15428.677569941323!2d-91.5976214046522!3d14.673824584347576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x858e7230489069d5%3A0x6734346067087661!2sEl%20Palmar!5e0!3m2!1ses!2sgt!4v1701380000000!5m2!1ses!2sgt" 
                width="100%" 
                height="100%" 
                style={{border:0, borderRadius: '0.5rem'}} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;