// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Play, Pause, AlertTriangle, Skull, Clock, Calendar, Settings, RotateCcw, Activity, ArrowLeft, CloudRain, Sun, Zap, FastForward, Gauge, Wrench, Timer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import RoadVisualizer from './RoadVisualizer';
import { useSimulationEngine } from '../simulation/engine';
import { SCENARIOS } from '../simulation/constants';

const Dashboard = () => {
  const [inputConfig, setInputConfig] = useState({
    startHour: "06:00",
    greenDuration: 400,
    rainIntensity: 0,
    allowOvertaking: true,
    timeScale: 1 
  });

  const [activeScenario, setActiveScenario] = useState(SCENARIOS.REAL);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); 
  const [resetTrigger, setResetTrigger] = useState(0); 
  const [viewMode, setViewMode] = useState('DASHBOARD'); 

  const { vehicles, stats, trafficState, simTime, dayCount, accidentReport, breakdownAlert, accidentHistory } = useSimulationEngine(activeScenario, isRunning, inputConfig, resetTrigger);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (isRunning && simTime) {
        setChartData(prev => {
            const newPoint = {
                time: simTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                costo: Math.round(stats.totalCost),
                espera: stats.avgWaitTime,
                velocidad: stats.averageSpeed
            };
            const newData = [...prev, newPoint];
            if (newData.length > 20) newData.shift();
            return newData;
        });
    }
  }, [simTime, isRunning, stats]);

  const handleStartToggle = () => {
      if (!hasStarted) setHasStarted(true);
      setIsRunning(!isRunning);
  };

  const handleReset = () => {
      setIsRunning(false);
      setHasStarted(false);
      setChartData([]);
      setResetTrigger(prev => prev + 1);
      setViewMode('DASHBOARD');
  };

  const formatTime24h = (date) => {
      if (!date) return inputConfig.startHour;
      return date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (viewMode === 'ACCIDENT_LOG') {
      return (
          <div className="min-h-screen bg-slate-100 p-6 font-sans">
              <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                  <header className="bg-slate-800 text-white p-6 flex justify-between items-center">
                      <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2"><Skull /> Reporte de Accidentes</h2>
                          <p className="text-slate-400 text-sm">Registro detallado de incidentes simulados</p>
                      </div>
                      <button onClick={() => setViewMode('DASHBOARD')} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded flex items-center gap-2 transition-colors">
                          <ArrowLeft size={18} /> Volver a Simulación
                      </button>
                  </header>
                  <div className="p-6">
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-gray-600">
                              <thead className="bg-gray-100 text-gray-800 uppercase font-bold text-xs">
                                  <tr>
                                      <th className="p-3">Hora</th>
                                      <th className="p-3">Vehículo</th>
                                      <th className="p-3">Tipo Choque</th>
                                      <th className="p-3 text-center">Heridos</th>
                                      <th className="p-3">Carga / Detalle</th>
                                      <th className="p-3 text-right">Costo Total</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                  {accidentHistory.length === 0 ? (
                                      <tr><td colSpan="6" className="p-8 text-center">Sin accidentes registrados</td></tr>
                                  ) : (accidentHistory.map((acc) => (
                                      <tr key={acc.id} className="hover:bg-gray-50">
                                          <td className="p-3 font-mono">{acc.time}</td>
                                          <td className="p-3 font-bold uppercase">{acc.type}</td>
                                          <td className="p-3 text-xs">{acc.collisionType}</td>
                                          <td className="p-3 text-center text-red-600">{acc.details.injured}</td>
                                          <td className="p-3">{acc.type === 'TRUCK' ? acc.details.cargoDesc : 'N/A'}</td>
                                          <td className="p-3 text-right font-bold">Q {Math.round(acc.details.materialLoss + acc.details.cargoLoss).toLocaleString()}</td>
                                      </tr>
                                  )))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      {/* ALERTAS VISUALES */}
      {accidentReport && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-bounce flex items-center gap-4 border-4 border-red-800">
              <Skull size={32} />
              <div><h3 className="font-black text-xl uppercase">¡Accidente!</h3><p className="text-sm font-bold">Vehículo: {accidentReport.lastType}</p></div>
          </div>
      )}
      {breakdownAlert && (
          <div className="fixed top-40 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-pulse flex items-center gap-4 border-4 border-orange-700">
              <Wrench size={32} />
              <div><h3 className="font-black text-xl uppercase">Falla Mecánica</h3><p className="text-sm font-bold">Vehículo averiado en pendiente: {breakdownAlert.type}</p></div>
          </div>
      )}

      <header className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-8 border-indigo-600 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Simulador Cito-Zarco Km 194</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
             <div className="flex items-center gap-2 bg-slate-800 text-green-400 px-3 py-1 rounded font-mono shadow-inner"><Clock size={14}/> {formatTime24h(simTime)}</div>
             <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded font-bold text-orange-600"><Calendar size={14}/> DÍA {dayCount}</div>
             <button onClick={() => setViewMode('ACCIDENT_LOG')} className={`flex items-center gap-2 px-3 py-1 rounded font-bold transition-all border ${accidentHistory.length > 0 ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                <Skull size={14}/> Accidentes: {accidentHistory.length}
             </button>
          </div>
        </div>
        <div className="flex gap-4 items-center">
             <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                 <button onClick={() => setInputConfig({...inputConfig, timeScale: 0.5})} className={`px-2 py-1 text-xs font-bold rounded ${inputConfig.timeScale === 0.5 ? 'bg-white text-blue-600' : 'text-gray-400'}`}>0.5x</button>
                 <button onClick={() => setInputConfig({...inputConfig, timeScale: 1})} className={`px-2 py-1 text-xs font-bold rounded ${inputConfig.timeScale === 1 ? 'bg-white text-blue-600' : 'text-gray-400'}`}>1x</button>
                 <button onClick={() => setInputConfig({...inputConfig, timeScale: 2})} className={`px-2 py-1 text-xs font-bold rounded ${inputConfig.timeScale === 2 ? 'bg-white text-blue-600' : 'text-gray-400'}`}>2x</button>
             </div>
            <div className={`px-4 py-2 rounded font-bold text-white flex items-center gap-2 shadow ${trafficState.phase === 'DESPEJE' ? 'bg-orange-500 animate-pulse' : 'bg-slate-700'}`}>
                {trafficState.phase === 'DESPEJE' ? <><AlertTriangle size={16}/> DESPEJE</> : trafficState.phase}
            </div>
            <button onClick={handleReset} className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center gap-2 font-bold shadow-sm"><RotateCcw size={16}/> REINICIAR</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2"><Settings size={18} /> Configuración</h3>
            <div className="space-y-4">
                <div><label className="text-xs font-bold text-gray-500">HORA INICIO (24H)</label><input type="time" disabled={hasStarted} className="w-full mt-1 p-2 border rounded font-mono" value={inputConfig.startHour} onChange={(e) => setInputConfig({...inputConfig, startHour: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 flex justify-between"><span>LLUVIA ({inputConfig.rainIntensity})</span>{inputConfig.rainIntensity > 5 ? <CloudRain size={14} className="text-blue-500"/> : <Sun size={14} className="text-yellow-500"/>}</label><input type="range" min="0" max="10" className="w-full mt-1 h-2 bg-gray-200 rounded-lg cursor-pointer" value={inputConfig.rainIntensity} onChange={(e) => setInputConfig({...inputConfig, rainIntensity: parseInt(e.target.value)})} /></div>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border"><input type="checkbox" checked={inputConfig.allowOvertaking} onChange={(e) => setInputConfig({...inputConfig, allowOvertaking: e.target.checked})} className="w-4 h-4" /><label className="text-sm text-gray-700 font-medium">Permitir Rebasar</label></div>
                <div><label className="text-xs font-bold text-gray-500">ESCENARIO</label><select className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-sm" value={activeScenario.id} onChange={(e) => { handleReset(); setActiveScenario(SCENARIOS[e.target.value]); }}>{Object.values(SCENARIOS).map(sc => (<option key={sc.id} value={sc.id}>{sc.name}</option>))}</select></div>
                <button onClick={handleStartToggle} className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 shadow-md ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{isRunning ? <><Pause size={20} /> PAUSAR</> : <><Play size={20} /> {hasStarted ? 'CONTINUAR' : 'INICIAR'}</>}</button>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-indigo-500">
            <h3 className="font-bold text-gray-700 mb-2 text-sm">KPIs Económicos (Acumulado)</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-end"><span className="text-xs text-gray-500">Costo Total</span><span className="text-xl font-black text-indigo-700">Q {stats.totalCost.toFixed(0)}</span></div>
                <div className="pt-2 border-t text-xs">
                    <div className="flex justify-between text-gray-600"><span>Combustible:</span> <span className="font-bold">Q {stats.fuelCost.toFixed(0)}</span></div>
                    <div className="flex justify-between text-orange-600"><span>Oportunidad/Carga:</span> <span className="font-bold">Q {stats.cargoCost.toFixed(0)}</span></div>
                </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 space-y-6">
            <RoadVisualizer vehicles={vehicles} trafficState={trafficState} weatherIntensity={inputConfig.rainIntensity} scenarioMode={activeScenario.id} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-64">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-700 text-xs mb-4 uppercase flex items-center gap-2"><Activity size={14}/> Costo Operativo</h4>
                    <ResponsiveContainer width="100%" height="80%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><YAxis tick={{fontSize: 9}} width={35}/><Tooltip contentStyle={{fontSize: '11px'}}/><Area type="monotone" dataKey="costo" stroke="#4f46e5" fill="#e0e7ff" isAnimationActive={false}/></AreaChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-700 text-xs mb-4 uppercase flex items-center gap-2"><Timer size={14}/> Tiempo Espera Prom.</h4>
                    <ResponsiveContainer width="100%" height="80%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><YAxis tick={{fontSize: 9}} width={30}/><Tooltip contentStyle={{fontSize: '11px'}}/><Area type="monotone" dataKey="espera" stroke="#f59e0b" fill="#fef3c7" isAnimationActive={false}/></AreaChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-700 text-xs mb-4 uppercase flex items-center gap-2"><Gauge size={14}/> Velocidad Prom. (km/h)</h4>
                    <ResponsiveContainer width="100%" height="80%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><YAxis tick={{fontSize: 9}} width={30} domain={[0, 90]}/><Tooltip contentStyle={{fontSize: '11px'}}/><Line type="monotone" dataKey="velocidad" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false}/></LineChart></ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;