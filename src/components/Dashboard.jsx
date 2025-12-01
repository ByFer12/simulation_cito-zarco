// src/components/Dashboard.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable'; 
import { Play, Pause, RotateCcw, Download, FileText, CloudRain, Activity, DollarSign, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RoadVisualizer from './RoadVisualizer';
import { useSimulationEngine } from '../simulation/engine';
import { SCENARIOS } from '../simulation/constants';

const Dashboard = () => {
  const [config, setConfig] = useState({ startHour: "06:00", greenDuration: 40, rainIntensity: 0, timeScale: 1 });
  const [activeScenario, setActiveScenario] = useState(SCENARIOS.REAL);
  const [isRunning, setIsRunning] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  // AGREGADO: dayCount en la desestructuración para arreglar el bug del día
  const { vehicles, trafficState, simTime, dayCount, stats, currentRisk, accidentReport, historyLog, accidentLog, breakdownAlert } = useSimulationEngine(activeScenario, isRunning, config, resetCount);

  // --- EXPORTAR EXCEL ---
  const exportExcel = () => {
      const wb = XLSX.utils.book_new();
      
      const summaryData = [
          ["Reporte de Simulación Km 194", new Date().toLocaleString()],
          ["Escenario", activeScenario.name],
          ["Costo Total Acumulado", `Q ${stats.totalCost.toFixed(2)}`],
          ["Velocidad Promedio", `${stats.avgSpeed.toFixed(2)} km/h`],
          ["Total Vehículos", vehicles.length]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      if (historyLog.current.length > 0) {
          const wsHistory = XLSX.utils.json_to_sheet(historyLog.current);
          XLSX.utils.book_append_sheet(wb, wsHistory, "Histórico KPIs");
      }

      if (accidentLog.current.length > 0) {
          const wsAccidents = XLSX.utils.json_to_sheet(accidentLog.current);
          XLSX.utils.book_append_sheet(wb, wsAccidents, "Accidentes");
      }

      XLSX.writeFile(wb, `Simulacion_CitoZarco_${Date.now()}.xlsx`);
  };

  // --- EXPORTAR PDF MODIFICADO ---
  const exportPDF = () => {
      const doc = new jsPDF();
      doc.text("Reporte de Incidentes Viales - Ruta Cito-Zarco", 14, 20);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);
      
      if (accidentLog.current.length === 0) {
          doc.text("No se registraron accidentes durante la simulación.", 14, 40);
      } else {
          // MODIFICADO: Agregadas columnas de Ocupantes y Heridos
          autoTable(doc, {
              startY: 35,
              head: [['Hora', 'Vehículo', 'Causa', 'Ocup.', 'Heridos', 'Pérdida (Q)']],
              body: accidentLog.current.map(acc => [
                  acc.time, 
                  acc.type, 
                  acc.cause, 
                  acc.passengers, // Cantidad de ocupantes
                  acc.injured,    // Cantidad de heridos
                  `Q ${acc.cost.toLocaleString()}` // Formato explícito de Quetzales
              ]),
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [220, 38, 38] }
          });
      }
      doc.save(`Reporte_Accidentes_${Date.now()}.pdf`);
  };

  const formatTime = (date) => date ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      
      {/* ALERTAS */}
      {accidentReport && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce flex items-center gap-4 border-4 border-red-800">
              <div className="text-3xl">💥</div>
              <div>
                  <h3 className="font-bold text-lg">ACCIDENTE REPORTADO</h3>
                  {/* MODIFICADO: Mostrar heridos en la alerta en pantalla también */}
                  <p className="text-sm">Pérdidas: Q{accidentReport.cost.toLocaleString()} | Heridos: {accidentReport.injured}</p>
              </div>
          </div>
      )}

      {breakdownAlert && (
          <div className="fixed top-40 left-1/2 -translate-x-1/2 z-50 bg-orange-500 text-white px-6 py-3 rounded-xl shadow-xl animate-pulse flex gap-3 border-4 border-orange-700">
              <div className="text-2xl">🔧</div>
              <div><h3 className="font-bold">FALLA MECÁNICA</h3><p className="text-xs">{breakdownAlert.type}</p></div>
          </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow border-l-4 border-indigo-600 gap-4">
          <div>
              <h1 className="text-2xl font-black text-slate-800">Simulador Cito-Zarco <span className="text-indigo-600">Km 194</span></h1>
              <div className="flex gap-4 mt-1 text-sm text-slate-500 font-mono">
                  <span className="flex items-center gap-1 bg-slate-100 px-2 rounded"><Activity size={14}/> {formatTime(simTime)}</span>
                  {/* CORRECCIÓN BUG DÍA: Usamos dayCount en vez de Date.now() */}
                  <span className="flex items-center gap-1 bg-slate-100 px-2 rounded">Día {dayCount}</span>
              </div>
          </div>
          <a href="https://github.com/ByFer12/simulation_cito-zarco.git" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Repositorio GitHub</a>
          <div className="flex gap-3">
              <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition shadow-sm">
                  <Download size={16}/> Excel
              </button>
              <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition shadow-sm">
                  <FileText size={16}/> PDF
              </button>
          </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* BARRA LATERAL */}
          <div className="lg:col-span-3 space-y-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Panel de Control</h3>
                  
                  <div className="space-y-4">
                      {/* Botones Start/Reset */}
                      <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => setIsRunning(!isRunning)} 
                                  className={`py-3 rounded-lg font-bold text-white flex justify-center items-center gap-2 shadow-md transition-colors ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                              {isRunning ? <><Pause size={18}/> Pausa</> : <><Play size={18}/> Iniciar</>}
                          </button>
                          <button onClick={() => { setIsRunning(false); setResetCount(c => c+1); }} 
                                  className="bg-slate-200 text-slate-600 rounded-lg font-bold flex justify-center items-center hover:bg-slate-300 shadow-inner">
                              <RotateCcw size={18}/>
                          </button>
                      </div>

                      {/* Selector Escenario */}
                      <div>
                          <label className="text-xs font-bold text-slate-400">ESCENARIO</label>
                          <select className="w-full mt-1 p-2 bg-slate-50 border rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={activeScenario.id}
                                  onChange={(e) => { setIsRunning(false); setActiveScenario(SCENARIOS[e.target.value]); setResetCount(c => c+1); }}>
                              {Object.values(SCENARIOS).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                          </select>
                      </div>

                      {/* Sliders */}
                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                              <span className="flex items-center gap-1"><CloudRain size={12}/> LLUVIA</span>
                              <span>{config.rainIntensity * 10}%</span>
                          </div>
                          <input type="range" min="0" max="10" value={config.rainIntensity} onChange={(e) => setConfig({...config, rainIntensity: parseInt(e.target.value)})} className="w-full accent-blue-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                      </div>

                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                              <span>VELOCIDAD SIM.</span>
                              <span>{config.timeScale}x</span>
                          </div>
                          <input type="range" min="1" max="5" value={config.timeScale} onChange={(e) => setConfig({...config, timeScale: parseInt(e.target.value)})} className="w-full accent-indigo-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"/>
                      </div>
                  </div>
              </div>

              {/* KPI RIESGO */}
              <div className={`p-5 rounded-xl shadow-lg text-white transition-colors duration-500 ${currentRisk > 70 ? 'bg-red-600' : currentRisk > 30 ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-xs font-bold opacity-80 uppercase">Riesgo Accidente</p>
                          <h2 className="text-4xl font-black mt-1">{Math.round(currentRisk)}%</h2>
                      </div>
                      <ShieldAlert size={40} className="opacity-40"/>
                  </div>
                  <div className="mt-4 w-full bg-black/20 rounded-full h-2">
                      <div className="bg-white/90 h-2 rounded-full transition-all duration-500 shadow-sm" style={{ width: `${currentRisk}%` }}></div>
                  </div>
              </div>
          </div>

          {/* VISUALIZADOR Y GRAFICOS */}
          <div className="lg:col-span-9 space-y-6">
              <RoadVisualizer 
                  vehicles={vehicles} 
                  trafficState={trafficState} 
                  weatherIntensity={config.rainIntensity} 
                  scenarioMode={activeScenario.id}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* KPI COSTO */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center gap-2 text-slate-500 mb-2">
                          <DollarSign size={18} className="text-green-600"/>
                          <span className="text-xs font-bold uppercase">Pérdida Económica</span>
                      </div>
                      {/* Formato Q Quetzales */}
                      <p className="text-2xl font-black text-slate-800">Q {stats.totalCost.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                      <p className="text-xs text-slate-400 mt-1">Combustible + Oportunidad</p>
                  </div>

                  {/* GRAFICO */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 md:col-span-2 h-40">
                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Histórico de Velocidad Promedio</h4>
                       <ResponsiveContainer width="100%" height="80%">
                           <AreaChart data={historyLog.current.slice(-20)}>
                               <defs>
                                   <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                   </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                               <XAxis dataKey="time" hide />
                               <YAxis domain={[0, 80]} tick={{fontSize: 10}} />
                               <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                               <Area type="monotone" dataKey="avgSpeed" stroke="#6366f1" fillOpacity={1} fill="url(#colorSpeed)" />
                           </AreaChart>
                       </ResponsiveContainer>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;