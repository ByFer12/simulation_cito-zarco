// src/components/RoadVisualizer.jsx
import React, { useState } from 'react';
import { Truck, Car, Bus, Bike, AlertTriangle, Construction, Flame, Wrench, Info, Package, Users, Droplets, DollarSign, Gauge } from 'lucide-react';
import { ROAD } from '../simulation/constants';

const RoadVisualizer = ({ 
    vehicles = [], 
    trafficState, 
    weatherIntensity = 0, 
    scenarioMode = 'REAL' 
}) => {
  
  const [hoveredVehicle, setHoveredVehicle] = useState(null);

  // Seguridad por si trafficState es null al inicio
  const safeTraffic = trafficState || { 
      lightXela: 'GREEN', 
      lightReu: 'GREEN', 
      phase: 'OPEN' 
  };

  // Diccionario para nombres más bonitos en pantalla
  const VEHICLE_LABELS = {
      'TRUCK': 'Tráiler Pesado',
      'BUS': 'Bus Extraurbano',
      'CAR': 'Vehículo Liviano',
      'MOTO': 'Motocicleta',
      'PICKUP': 'Pick-up Agrícola'
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

  // Prepara la info del vehículo seleccionado
  const info = hoveredVehicle ? {
      label: VEHICLE_LABELS[hoveredVehicle.type] || hoveredVehicle.type,
      speed: Math.round(hoveredVehicle.v * 3.6), // Convertir m/s a km/h para visualización
      passengers: hoveredVehicle.passengers || 1, // Viene del spread ...proto en engine.js
      // Si no existe accumulatedCost en el engine, usamos 0.
      tripCost: hoveredVehicle.accumulatedCost || 0, 
      cargoName: hoveredVehicle.cargo?.name || 'Sin Carga Comercial',
      cargoValue: hoveredVehicle.cargo?.currentValue || 0,
      isPerishable: hoveredVehicle.cargo?.perishable || false,
      totalValue: (hoveredVehicle.cargo?.currentValue || 0) + (hoveredVehicle.accumulatedCost || 0)
  } : null;

  return (
    <div className="relative w-full h-80 bg-stone-300 overflow-hidden rounded-xl border-4 border-gray-800 shadow-2xl">
      
      {/* TOOLTIP HUD MEJORADO */}
      {info && (
          <div className="absolute z-50 bg-slate-900/95 text-white p-4 rounded-xl shadow-2xl backdrop-blur-md border border-slate-600 w-72 pointer-events-none transition-opacity duration-200"
               style={{ top: '12px', left: '12px' }}>
              
              {/* Encabezado */}
              <div className="flex items-center justify-between border-b border-gray-600 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${hoveredVehicle.type === 'TRUCK' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          <Info size={16}/>
                      </div>
                      <div>
                          <h4 className="font-bold text-sm leading-tight">{info.label}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {hoveredVehicle.uid.toString().slice(-6)}</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-emerald-400 font-mono font-bold text-sm">
                          <Gauge size={14}/> {info.speed} <span className="text-[10px]">km/h</span>
                      </div>
                  </div>
              </div>
              
              {/* Cuerpo de Datos */}
              <div className="space-y-3 text-xs">
                  
                  {/* Fila 1: Pasajeros y Costo Viaje */}
                  <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                          <span className="text-gray-400 flex items-center gap-1.5 mb-1"><Users size={12}/> Ocupantes</span>
                          <span className="font-bold text-lg">{info.passengers}</span>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                          <span className="text-gray-400 flex items-center gap-1.5 mb-1"><DollarSign size={12}/> Gasto Oper.</span>
                          <span className="font-bold text-lg text-yellow-500">Q{Math.round(info.tripCost)}</span>
                      </div>
                  </div>
                  
                  {/* Sección Carga (Solo si es camión, pickup o tiene valor) */}
                  {(hoveredVehicle.type === 'TRUCK' || hoveredVehicle.type === 'PICKUP' || info.cargoValue > 0) && (
                      <div className="bg-slate-800 p-2.5 rounded border border-slate-600">
                          <div className="flex justify-between items-start mb-1">
                              <p className="text-gray-400 flex items-center gap-1.5"><Package size={12}/> Carga</p>
                              {info.isPerishable && <span className="bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded text-[10px] border border-red-800">Perecedero</span>}
                          </div>
                          <p className="font-bold text-white text-sm truncate">{info.cargoName}</p>
                          <p className="text-emerald-400 font-mono mt-1">Val: Q{info.cargoValue.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
                      </div>
                  )}

                  {/* Total Económico en Riesgo */}
                  <div className="flex justify-between items-center border-t border-gray-700 pt-2 mt-1">
                      <span className="text-gray-400 flex items-center gap-1.5">Capital en Riesgo</span>
                      <span className="font-bold text-emerald-400 text-sm">Q {Math.round(info.totalValue).toLocaleString()}</span>
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
                    <div className={`w-3 h-3 rounded-full mb-1 transition-colors duration-300 ${safeTraffic.lightXela === 'RED' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`}></div>
                    <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${safeTraffic.lightXela === 'GREEN' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-green-900'}`}></div>
                </div>
            </div>
            <div className="absolute top-8 z-30 flex flex-col-reverse items-center" style={{ left: `${(ROAD.STOP_LINE_REU / ROAD.LENGTH) * 100}%`, transform: 'translateX(-50%)' }}>
                <div className="bg-black p-1 rounded border border-gray-600 shadow-lg">
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
                className={`absolute transition-transform duration-100 ease-linear z-20 ${v.color} cursor-pointer group`} 
                style={{ top: `${laneY + overtakeOffset}%`, left: `${(v.x / ROAD.LENGTH) * 100}%`, transform: `translate(-50%, -50%) ${v.direction === 'TO_REU' ? 'scaleX(-1)' : 'scaleX(1)'}`, zIndex: v.isOvertaking ? 40 : 20 }}
                // EVENTOS MEJORADOS: Mouse y Click
                onMouseEnter={() => setHoveredVehicle(v)}
                onMouseLeave={() => setHoveredVehicle(null)}
                onClick={() => setHoveredVehicle(v)}
            >
             <div className="relative flex items-center justify-center">
                {renderVehicleBody(v)}
                {/* Indicadores de estado */}
                {v.status === 'CRASHED' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce"><Flame size={20} className="text-red-500 fill-orange-500" /></div>}
                {v.status === 'BROKEN_DOWN' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-pulse"><Wrench size={20} className="text-gray-200 fill-gray-600" /></div>}
                {v.status === 'STOPPED' && <div className={`absolute w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_8px_red] animate-pulse ${v.direction === 'TO_XELA' ? '-left-2' : '-right-2'}`}></div>}
             </div>
             {/* Hitbox expandido para facilitar el click */}
             <div className="absolute -inset-2 bg-transparent rounded-full"></div>
            </div>
        );
      })}
    </div>
  );
};

export default RoadVisualizer;