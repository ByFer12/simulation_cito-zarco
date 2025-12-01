// src/components/ComparativeView.jsx
import React, { useState } from 'react';
import { Play, Pause, RotateCcw, TrendingUp, AlertTriangle, X, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import RoadVisualizer from './RoadVisualizer';
import { useSimulationEngine } from '../simulation/engine';
import { SCENARIOS } from '../simulation/constants';

const ComparativeView = () => {
  // Estado Global
  const [isRunning, setIsRunning] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [config, setConfig] = useState({ startHour: "07:00", greenDuration: 40, rainIntensity: 0, timeScale: 2 });
  
  // Selección de Escenarios
  const [scenarioA, setScenarioA] = useState(SCENARIOS.REAL);
  const [scenarioB, setScenarioB] = useState(SCENARIOS.OPTIMISTA);

  // Estado para los Modales de Reporte
  const [activeModal, setActiveModal] = useState(null); // 'A', 'B' o null

  // Motores de Simulación
  const simA = useSimulationEngine(scenarioA, isRunning, config, resetCount);
  const simB = useSimulationEngine(scenarioB, isRunning, config, resetCount);

  // Datos para gráficas
  const chartData = [
    {
      name: 'Costo (Q)',
      [scenarioA.name]: simA.stats.totalCost,
      [scenarioB.name]: simB.stats.totalCost,
    },
    {
      name: 'Velocidad (km/h)',
      [scenarioA.name]: simA.stats.avgSpeed,
      [scenarioB.name]: simB.stats.avgSpeed,
    }
  ];

  // Componente Modal de Accidentes
  const AccidentModal = ({ title, logs, onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="text-red-500"/> Reporte de Incidentes: {title}</h3>
                <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded"><X size={20}/></button>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
                {logs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        <p>No se han registrado accidentes en este escenario aún.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                            <tr>
                                <th className="p-3">Hora</th>
                                <th className="p-3">Vehículo</th>
                                <th className="p-3">Causa</th>
                                <th className="p-3 text-center">Heridos</th>
                                <th className="p-3 text-right">Pérdida</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((acc, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-3">{acc.time}</td>
                                    <td className="p-3">{acc.type}</td>
                                    <td className="p-3 text-slate-500">{acc.cause}</td>
                                    <td className="p-3 text-center font-bold text-red-600">{acc.injured}</td>
                                    <td className="p-3 text-right font-mono">Q{acc.cost.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <div className="bg-slate-50 p-3 border-t text-right">
                <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-bold text-slate-700">Cerrar Reporte</button>
            </div>
        </div>
    </div>
  );

  // Generador de Conclusiones
  const getConclusion = () => {
    const costDiff = simA.stats.totalCost - simB.stats.totalCost;
    const isACheaper = costDiff < 0;
    const speedDiff = simB.stats.avgSpeed - simA.stats.avgSpeed;
    
    return (
      <div className="bg-slate-800 text-white p-4 rounded-lg shadow-inner text-sm space-y-2 relative">
        <h4 className="font-bold text-yellow-400 flex items-center gap-2"><TrendingUp size={16}/> CONCLUSIONES EN TIEMPO REAL</h4>
        <p>
          Comparando <strong>{scenarioA.name}</strong> vs <strong>{scenarioB.name}</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300 mb-4">
          <li>
            Diferencia Económica: <span className={isACheaper ? "text-green-400" : "text-red-400"}>
              Q {Math.abs(costDiff).toLocaleString(undefined, {maximumFractionDigits:0})}
            </span> {isACheaper ? "a favor del Escenario A" : "de ahorro si se opta por el Escenario B"}.
          </li>
          <li>
            El flujo vehicular es <span className="font-bold text-white">{Math.abs(speedDiff).toFixed(1)} km/h</span> {speedDiff > 0 ? "más rápido" : "más lento"} en el Escenario B.
          </li>
        </ul>

        {/* BOTONES DE REPORTE DE ACCIDENTES INTEGRADOS */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700">
            <button 
                onClick={() => setActiveModal('A')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-500/30 rounded text-indigo-200 text-xs transition-colors">
                <FileText size={14}/> Reporte {scenarioA.name}
                {simA.accidentLog.current.length > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 rounded-full">{simA.accidentLog.current.length}</span>}
            </button>
            <button 
                onClick={() => setActiveModal('B')}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-900/50 hover:bg-emerald-900 border border-emerald-500/30 rounded text-emerald-200 text-xs transition-colors">
                <FileText size={14}/> Reporte {scenarioB.name}
                {simB.accidentLog.current.length > 0 && <span className="bg-red-600 text-white text-[10px] px-1.5 rounded-full">{simB.accidentLog.current.length}</span>}
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans text-slate-800 animate-in fade-in duration-500">
      
      {/* MODALES */}
      {activeModal === 'A' && <AccidentModal title={scenarioA.name} logs={simA.accidentLog.current} onClose={() => setActiveModal(null)} />}
      {activeModal === 'B' && <AccidentModal title={scenarioB.name} logs={simB.accidentLog.current} onClose={() => setActiveModal(null)} />}

      {/* HEADER DE CONTROL */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6 border-b-4 border-indigo-600 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800">Sala de Comparativa <span className="text-indigo-600">Simulador Km 194</span></h2>
            <p className="text-xs text-slate-500">Analizando dos escenarios simultáneamente</p>
          </div>

          <div className="flex gap-4 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-slate-400 uppercase">Escenario A (Izquierda)</label>
               <select className="text-sm font-bold bg-transparent outline-none" 
                       value={scenarioA.id} onChange={(e) => { setIsRunning(false); setScenarioA(SCENARIOS[e.target.value]); setResetCount(c=>c+1); }}>
                   {Object.values(SCENARIOS).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
            </div>
            <div className="h-8 w-px bg-slate-300 mx-2"></div>
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-slate-400 uppercase">Escenario B (Derecha)</label>
               <select className="text-sm font-bold bg-transparent outline-none"
                       value={scenarioB.id} onChange={(e) => { setIsRunning(false); setScenarioB(SCENARIOS[e.target.value]); setResetCount(c=>c+1); }}>
                   {Object.values(SCENARIOS).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsRunning(!isRunning)} className={`px-6 py-2 rounded-lg font-bold text-white shadow transition-transform active:scale-95 flex items-center gap-2 ${isRunning ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                {isRunning ? <><Pause size={18}/> Pausar Análisis</> : <><Play size={18}/> Correr Ambos</>}
            </button>
            <button onClick={() => { setIsRunning(false); setResetCount(c => c+1); }} className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300 text-slate-600">
                <RotateCcw size={20}/>
            </button>
          </div>
      </div>

      {/* GRID DE COMPARACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUMNA ESCENARIO A */}
          <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                  <h3 className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">{scenarioA.name}</h3>
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded shadow-sm border">Riesgo: {Math.round(simA.currentRisk)}%</span>
              </div>
              <div className="transform scale-95 origin-top">
                <RoadVisualizer vehicles={simA.vehicles} trafficState={simA.trafficState} weatherIntensity={config.rainIntensity} scenarioMode={scenarioA.id} />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded shadow-sm border-l-4 border-red-500">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Costo Acumulado</p>
                      <p className="text-lg font-black text-slate-800">Q {simA.stats.totalCost.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-500">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Velocidad Prom.</p>
                      <p className="text-lg font-black text-slate-800">{simA.stats.avgSpeed.toFixed(1)} km/h</p>
                  </div>
              </div>
          </div>

          {/* COLUMNA ESCENARIO B */}
          <div className="space-y-4">
               <div className="flex justify-between items-center px-2">
                  <h3 className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">{scenarioB.name}</h3>
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded shadow-sm border">Riesgo: {Math.round(simB.currentRisk)}%</span>
              </div>
              <div className="transform scale-95 origin-top">
                <RoadVisualizer vehicles={simB.vehicles} trafficState={simB.trafficState} weatherIntensity={config.rainIntensity} scenarioMode={scenarioB.id} />
              </div>

               <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded shadow-sm border-l-4 border-red-500">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Costo Acumulado</p>
                      <p className="text-lg font-black text-slate-800">Q {simB.stats.totalCost.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-500">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Velocidad Prom.</p>
                      <p className="text-lg font-black text-slate-800">{simB.stats.avgSpeed.toFixed(1)} km/h</p>
                  </div>
              </div>
          </div>

      </div>

      {/* PANEL INFERIOR DE ANÁLISIS */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRÁFICA COMPARATIVA */}
          <div className="bg-white p-4 rounded-xl shadow-md lg:col-span-2 h-64 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Diferencial de Costos y Eficiencia</h4>
              <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                      <Tooltip formatter={(value) => value.toLocaleString()} cursor={{fill: 'transparent'}} />
                      <Legend />
                      <Bar dataKey={scenarioA.name} fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                      <Bar dataKey={scenarioB.name} fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
              </ResponsiveContainer>
          </div>

          {/* CONCLUSIONES + MODALES */}
          <div className="flex flex-col gap-4">
              {getConclusion()}
              
              <div className="bg-white p-4 rounded-lg shadow border border-slate-200 flex-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>INTENSIDAD LLUVIA (Afecta a ambos)</span>
                      <span>{config.rainIntensity * 10}%</span>
                  </div>
                  <input type="range" min="0" max="10" value={config.rainIntensity} 
                         onChange={(e) => setConfig({...config, rainIntensity: parseInt(e.target.value)})} 
                         className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">Modificar el clima permite ver qué escenario es más resiliente.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ComparativeView;