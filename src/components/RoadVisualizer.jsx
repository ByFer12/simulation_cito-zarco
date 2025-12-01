// src/components/RoadVisualizer.jsx
import React, { useState } from 'react';
import { Truck, Car, Bus, Bike, AlertTriangle, Construction, Flame, Wrench, Info, Package, Users, Droplets, DollarSign } from 'lucide-react';
import { ROAD } from '../simulation/constants';


const RoadVisualizer = ({ 
    vehicles = [], 
    trafficState, // No confiamos en el valor por defecto de props aquí
    weatherIntensity = 0, 
    scenarioMode = 'REAL' 
}) => {
  
  const [hoveredVehicle, setHoveredVehicle] = useState(null);

  // --- CORRECCIÓN DEFINITIVA DE SEGURIDAD ---
  // Creamos un objeto de respaldo local. Si trafficState es null o undefined, usa este.
  const safeTraffic = trafficState || { 
      lightXela: 'GREEN', 
      lightReu: 'GREEN', 
      phase: 'OPEN' 
  };

  const renderVehicleBody = (v) => {
    if (v.type === 'PICKUP') {
        return <div className="flex items-center -space-x-1"><div className="relative z-10 bg-emerald-700 rounded-sm w-4 h-5 shadow-sm"></div><div className="w-8 h-5 bg-emerald-600 border border-emerald-800 rounded-sm flex items-center justify-center"><div className="w-6 h-3 bg-black/20"></div></div></div>;
    }
    switch (v.type) {
      case 'TRUCK': return <Truck size={36} className="text-orange-600" />;
      case 'BUS': return <Bus size={50} className="text-yellow-500" />;
      case 'MOTO': return <Bike size={30} className="text-purple-400" />;
      default: return <Car size={34} className="text-blue-400" />;
    }
  };

  return (
    <div className="relative w-full h-80 bg-stone-300 overflow-hidden rounded-xl border-4 border-gray-800 shadow-2xl">
      
      {/* TOOLTIP / POPOVER */}
      {hoveredVehicle && hoveredVehicle.info && (
          <div className="absolute z-50 bg-slate-900/95 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm border border-slate-700 w-64 pointer-events-none"
               style={{ top: '10px', left: '10px' }}>
              <div className="flex items-center justify-between border-b border-gray-600 pb-2 mb-2">
                  <h4 className="font-bold uppercase text-yellow-400 text-sm flex items-center gap-2">
                      <Info size={14}/> {hoveredVehicle.label}
                  </h4>
                  <span className="text-xs bg-slate-700 px-2 rounded">{hoveredVehicle.uid.toString().slice(-4)}</span>
              </div>
              
              <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2"><Users size={12}/> Pasajeros:</span>
                      <span className="font-bold">{hoveredVehicle.info.passengers}</span>
                  </div>
                  
                  {hoveredVehicle.info.cargo && (
                      <div className="bg-slate-800 p-2 rounded border border-slate-600 mt-1">
                          <p className="text-gray-400 flex items-center gap-2 mb-1"><Package size={12}/> Carga:</p>
                          <p className="font-bold text-emerald-400 truncate">{hoveredVehicle.info.cargo.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">
                              Valor: Q{hoveredVehicle.info.cargo.currentValue?.toLocaleString() || 0}
                          </p>
                          {hoveredVehicle.info.cargo.perishable && (
                              <p className="text-[10px] text-red-400 mt-1">
                                  ⚠ Perecedero ({hoveredVehicle.info.cargo.maxLife}h vida)
                              </p>
                          )}
                      </div>
                  )}

                  <div className="flex justify-between items-center">
                      <span className="text-gray-400 flex items-center gap-2"><Droplets size={12}/> Combustible:</span>
                      <span className="font-bold">{hoveredVehicle.fuelConsumed ? hoveredVehicle.fuelConsumed.toFixed(4) : 0} gl</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-gray-700 pt-2 mt-2">
                      <span className="text-gray-400 flex items-center gap-2"><DollarSign size={12}/> Capital Total:</span>
                      <span className="font-bold text-green-400">Q {hoveredVehicle.info.totalValue?.toLocaleString() || 0}</span>
                  </div>
              </div>
          </div>
      )}

      {/* CLIMA */}
      {weatherIntensity > 0 && <div className="absolute inset-0 z-50 pointer-events-none bg-blue-900 mix-blend-multiply" style={{ opacity: weatherIntensity * 0.05 }}><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] animate-pulse" style={{ opacity: weatherIntensity * 0.1 }}></div></div>}
      
      {/* CARRETERA */}
      <div className="absolute top-1/2 left-0 w-full h-48 bg-slate-800 -translate-y-1/2 border-y-8 border-slate-900 shadow-inner">
         <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-yellow-500 z-0"></div>
         <div className="absolute top-2 left-4 text-white/30 text-xs font-mono select-none">← A REU (COSTA)</div>
         <div className="absolute bottom-2 right-4 text-white/30 text-xs font-mono select-none">A XELA (ALTIPLANO) →</div>
         {scenarioMode !== 'OPTIMISTA' && <><div className="absolute bottom-0 h-1/2 w-2 bg-white/50 z-0" style={{ left: `${(ROAD.STOP_LINE_XELA / ROAD.LENGTH) * 100}%` }}></div><div className="absolute top-0 h-1/2 w-2 bg-white/50 z-0" style={{ left: `${(ROAD.STOP_LINE_REU / ROAD.LENGTH) * 100}%` }}></div></>}
      </div>

      {/* SOCAVAMIENTO */}
      {scenarioMode !== 'OPTIMISTA' && <div className="absolute bottom-[23%] z-10 h-24 flex items-center justify-center pointer-events-none" style={{ left: `${(ROAD.BOTTLENECK_START / ROAD.LENGTH) * 100}%`, width: `${((ROAD.BOTTLENECK_END - ROAD.BOTTLENECK_START) / ROAD.LENGTH) * 100}%` }}><div className="w-full h-full bg-stone-900 rounded-[2rem] border-b-8 border-red-900 shadow-2xl relative overflow-hidden group"><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dirt.png')] opacity-60"></div><div className="absolute inset-0 flex items-center justify-center"><Construction className="text-white opacity-50 w-8 h-8" /></div></div><div className="absolute -top-6 left-0 flex space-x-8 w-full justify-center"><AlertTriangle className="text-orange-500 animate-bounce" /></div></div>}
      
      {/* SEMÁFOROS (USANDO safeTraffic PARA EVITAR CRASH) */}
      {scenarioMode !== 'OPTIMISTA' && (
          <>
            <div className="absolute bottom-8 z-30 flex flex-col items-center" style={{ left: `${(ROAD.STOP_LINE_XELA / ROAD.LENGTH) * 100}%`, transform: 'translateX(-50%)' }}>
                <div className="bg-black p-1 rounded border border-gray-600 shadow-lg">
                    {/* Aquí usamos safeTraffic en lugar de trafficState */}
                    <div className={`w-3 h-3 rounded-full mb-1 transition-colors duration-300 ${safeTraffic.lightXela === 'RED' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`}></div>
                    <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${safeTraffic.lightXela === 'GREEN' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-green-900'}`}></div>
                </div>
            </div>
            <div className="absolute top-8 z-30 flex flex-col-reverse items-center" style={{ left: `${(ROAD.STOP_LINE_REU / ROAD.LENGTH) * 100}%`, transform: 'translateX(-50%)' }}>
                <div className="bg-black p-1 rounded border border-gray-600 shadow-lg">
                    {/* Aquí también safeTraffic */}
                    <div className={`w-3 h-3 rounded-full mb-1 transition-colors duration-300 ${safeTraffic.lightReu === 'RED' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`}></div>
                    <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${safeTraffic.lightReu === 'GREEN' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-green-900'}`}></div>
                </div>
            </div>
          </>
      )}
      
      {/* VEHÍCULOS */}
      {vehicles.map((v) => {
        let laneY = v.direction === 'TO_REU' ? 25 : 75; 
        if (scenarioMode !== 'OPTIMISTA' && v.direction === 'TO_XELA' && v.x > ROAD.BOTTLENECK_START && v.x < ROAD.BOTTLENECK_END) laneY = 25; 
        let overtakeOffset = 0;
        if (v.isOvertaking) { if (v.direction === 'TO_XELA') overtakeOffset = -15; if (v.direction === 'TO_REU') overtakeOffset = 15; }

        return (
            <div 
                key={v.uid} 
                className={`absolute transition-transform duration-100 ease-linear z-20 ${v.color} cursor-pointer`} 
                style={{ top: `${laneY + overtakeOffset}%`, left: `${(v.x / ROAD.LENGTH) * 100}%`, transform: `translate(-50%, -50%) ${v.direction === 'TO_REU' ? 'scaleX(-1)' : 'scaleX(1)'}`, zIndex: v.isOvertaking ? 40 : 20 }}
                onMouseEnter={() => setHoveredVehicle(v)}
                onMouseLeave={() => setHoveredVehicle(null)}
            >
             <div className="relative flex items-center justify-center group">
                {renderVehicleBody(v)}
                {v.status === 'CRASHED' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce"><Flame size={20} className="text-red-500 fill-orange-500" /></div>}
                {v.status === 'BROKEN_DOWN' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-pulse"><Wrench size={20} className="text-gray-200 fill-gray-600" /></div>}
                {v.status === 'STOPPED' && <div className={`absolute w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_8px_red] animate-pulse ${v.direction === 'TO_XELA' ? '-left-2' : '-right-2'}`}></div>}
             </div>
            </div>
        );
      })}
    </div>
  );
};

export default RoadVisualizer;