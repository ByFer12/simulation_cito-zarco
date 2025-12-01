// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, CloudRain, Sun, AlertTriangle, Skull, Clock, Calendar, Settings, RotateCcw, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import RoadVisualizer from './RoadVisualizer';
import { useSimulationEngine } from '../simulation/engine';
import { SCENARIOS } from '../simulation/constants';

const Dashboard = () => {
  // Configuración Editable UI
  const [inputConfig, setInputConfig] = useState({
    startHour: "06:00",
    greenDuration: 400,
    rainIntensity: 0,
    allowOvertaking: true
  });

  // Estado del Sistema
  const [activeScenario, setActiveScenario] = useState(SCENARIOS.REAL);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false); // Para controlar inputs
  const [resetTrigger, setResetTrigger] = useState(0); // Señal para resetear engine

  // Hook del motor
  const { vehicles, stats, trafficState, simTime, dayCount, accidentReport } = useSimulationEngine(activeScenario, isRunning, inputConfig, resetTrigger);

  const [chartData, setChartData] = useState([]);

  // Actualizar gráficos - Corregido para fluidez
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setChartData(prev => {
            const newData = [
                ...prev,
                {
                    time: simTime ? simTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
                    costo: Math.round(stats.totalCost),
                    colas: stats.stoppedVehicles
                }
            ];
            // Mantener solo los últimos 20 puntos para movimiento
            return newData.slice(-30);
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, stats, simTime]);

  const handleStartToggle = () => {
      if (!hasStarted) setHasStarted(true);
      setIsRunning(!isRunning);
  };

  const handleReset = () => {
      setIsRunning(false);
      setHasStarted(false);
      setChartData([]);
      setResetTrigger(prev => prev + 1); // Dispara el useEffect de limpieza en el engine
  };

  const formatTime24h = (date) => {
      if (!date) return inputConfig.startHour;
      return date.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      
      {/* HEADER con Alerta de Accidentes */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-8 border-blue-600 relative overflow-hidden gap-4">
        
        {/* OVERLAY DE ALERTA DE ACCIDENTE */}
        {accidentReport && accidentReport.active && (
            <div className="absolute inset-0 bg-red-600 text-white flex items-center justify-center animate-pulse z-50">
                <Skull className="mr-4" size={32}/>
                <div className="text-center">
                    <h2 className="text-2xl font-black uppercase tracking-widest">¡ACCIDENTE REGISTRADO!</h2>
                    <p className="text-sm font-bold">Vehículo: {accidentReport.lastType} — Tráfico Detenido</p>
                </div>
            </div>
        )}

        <div>
          <h1 className="text-2xl font-bold text-gray-800">Simulador de Impacto Vial - Km 194</h1>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
             {/* Datos Relevantes en Header */}
             <div className="flex items-center gap-2 bg-slate-800 text-green-400 px-3 py-1 rounded font-mono shadow-inner">
                <Clock size={14}/> {formatTime24h(simTime)}
             </div>
             <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded font-bold text-orange-600">
                <Calendar size={14}/> DÍA {dayCount}
             </div>
             <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded font-bold text-blue-600">
                <Activity size={14}/> Activos: {vehicles.length}
             </div>
             {accidentReport && (
                 <div className="flex items-center gap-2 bg-red-100 px-3 py-1 rounded font-bold text-red-600 border border-red-200">
                    <Skull size={14}/> Accidentes: {accidentReport.count}
                 </div>
             )}
          </div>
        </div>

        <div className="flex gap-4 items-center">
            <div className={`px-4 py-2 rounded font-bold text-white flex items-center gap-2 shadow ${trafficState.phase === 'DESPEJE' ? 'bg-orange-500 animate-pulse' : 'bg-slate-700'}`}>
                {trafficState.phase === 'DESPEJE' ? <><AlertTriangle size={16}/> DESPEJE</> : trafficState.phase}
            </div>
            
            <button 
                onClick={handleReset}
                className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 rounded border border-red-200 flex items-center gap-2 font-bold shadow-sm transition-colors"
            >
                <RotateCcw size={16}/> REINICIAR
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL DE CONTROL */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
                <Settings size={18} /> Configuración
            </h3>
            
            <div className="space-y-4">
                {/* Hora Inicio (Editable solo si no ha comenzado) */}
                <div>
                    <label className="text-xs font-bold text-gray-500">HORA INICIO (24H)</label>
                    <input 
                        type="time" 
                        disabled={hasStarted} // Solo se bloquea al darle Iniciar por primera vez
                        className={`w-full mt-1 p-2 border rounded font-mono ${hasStarted ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-800 border-blue-300'}`}
                        value={inputConfig.startHour}
                        onChange={(e) => setInputConfig({...inputConfig, startHour: e.target.value})}
                    />
                </div>

                {/* Controles Dinámicos */}
                <div>
                    <label className="text-xs font-bold text-gray-500 flex justify-between">
                        <span>LLUVIA ({inputConfig.rainIntensity})</span>
                        {inputConfig.rainIntensity > 5 ? <CloudRain size={14} className="text-blue-500"/> : <Sun size={14} className="text-yellow-500"/>}
                    </label>
                    <input 
                        type="range" min="0" max="10" 
                        className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={inputConfig.rainIntensity}
                        onChange={(e) => setInputConfig({...inputConfig, rainIntensity: parseInt(e.target.value)})}
                    />
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border">
                    <input 
                        type="checkbox" 
                        id="overtake"
                        checked={inputConfig.allowOvertaking}
                        onChange={(e) => setInputConfig({...inputConfig, allowOvertaking: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="overtake" className="text-sm text-gray-700 font-medium select-none cursor-pointer">Permitir Rebasar</label>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500">ESCENARIO</label>
                    <select 
                        className="w-full mt-1 p-2 border rounded-lg bg-gray-50 text-sm"
                        value={activeScenario.id}
                        onChange={(e) => {
                            handleReset(); // Cambiar escenario reinicia para evitar bugs físicos
                            setActiveScenario(SCENARIOS[e.target.value]);
                        }}
                    >
                        {Object.values(SCENARIOS).map(sc => (
                            <option key={sc.id} value={sc.id}>{sc.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleStartToggle}
                    className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                    {isRunning ? <><Pause size={20} /> PAUSAR</> : <><Play size={20} /> {hasStarted ? 'CONTINUAR' : 'INICIAR'}</>}
                </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-indigo-500">
            <h3 className="font-bold text-gray-700 mb-2 text-sm">KPIs Económicos</h3>
            <div className="space-y-3">
                <div className="flex justify-between items-end">
                    <span className="text-xs text-gray-500">Pérdida Acumulada</span>
                    <span className="text-xl font-black text-indigo-700">Q {stats.totalCost.toFixed(0)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                        <p className="text-[10px] text-gray-500">Combustible</p>
                        <p className="font-bold">{stats.fuelConsumed.toFixed(1)} Gal</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500">Colas (Veh)</p>
                        <p className="font-bold text-red-600">{stats.stoppedVehicles}</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* VISUALIZACIÓN */}
        <div className="lg:col-span-9 space-y-6">
            <RoadVisualizer 
                vehicles={vehicles} 
                trafficState={trafficState} 
                weatherIntensity={inputConfig.rainIntensity}
                scenarioMode={activeScenario.id}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-700 text-xs mb-4 uppercase flex items-center gap-2">
                        <Activity size={14}/> Costo Operativo (Tiempo Real)
                    </h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="time" hide />
                            <YAxis tick={{fontSize: 10}} width={40} />
                            <Tooltip contentStyle={{fontSize: '12px'}} />
                            <Area type="monotone" dataKey="costo" stroke="#4f46e5" fill="#e0e7ff" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h4 className="font-bold text-gray-700 text-xs mb-4 uppercase flex items-center gap-2">
                        <AlertTriangle size={14}/> Congestión (Vehículos Detenidos)
                    </h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="time" hide />
                            <YAxis tick={{fontSize: 10}} width={30} allowDecimals={false} />
                            <Tooltip contentStyle={{fontSize: '12px'}} />
                            <Line type="step" dataKey="colas" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;