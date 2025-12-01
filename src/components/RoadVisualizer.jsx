// src/components/RoadVisualizer.jsx
import React from 'react';
import { Truck, Car, Bus, Bike, AlertTriangle, Construction, Flame } from 'lucide-react';
import { ROAD } from '../simulation/constants';

const RoadVisualizer = ({ vehicles, trafficState, weatherIntensity, scenarioMode }) => {
  
  const renderVehicleBody = (v) => {
    if (v.type === 'PICKUP') {
        return (
            <div className="flex items-center -space-x-1">
                <div className="relative z-10 bg-emerald-700 rounded-sm w-4 h-5 shadow-sm"></div>
                <div className="w-8 h-5 bg-emerald-600 border border-emerald-800 rounded-sm flex items-center justify-center">
                   <div className="w-6 h-3 bg-black/20"></div>
                </div>
            </div>
        );
    }
    // TAMAÑOS SOLICITADOS APLICADOS AQUÍ
    switch (v.type) {
      case 'TRUCK': return <Truck size={36} className="text-orange-600" />;
      case 'BUS': return <Bus size={50} className="text-yellow-500" />;
      case 'MOTO': return <Bike size={30} className="text-purple-400" />;
      default: return <Car size={34} className="text-blue-400" />;
    }
  };

  return (
    <div className="relative w-full h-80 bg-stone-300 overflow-hidden rounded-xl border-4 border-gray-800 shadow-2xl">
      
      {/* EFECTOS DE CLIMA */}
      {weatherIntensity > 0 && (
        <div 
            className="absolute inset-0 z-50 pointer-events-none bg-blue-900 mix-blend-multiply"
            style={{ opacity: weatherIntensity * 0.05 }}
        >
            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] animate-pulse" 
                 style={{ opacity: weatherIntensity * 0.1 }}>
            </div>
        </div>
      )}

      {/* CARRETERA BASE */}
      <div className="absolute top-1/2 left-0 w-full h-48 bg-slate-800 -translate-y-1/2 border-y-8 border-slate-900 shadow-inner">
         <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-yellow-500 z-0"></div>
         <div className="absolute top-2 left-4 text-white/30 text-xs font-mono select-none">← A REU (COSTA)</div>
         <div className="absolute bottom-2 right-4 text-white/30 text-xs font-mono select-none">A XELA (ALTIPLANO) →</div>
         
         {scenarioMode !== 'OPTIMISTA' && (
             <>
                <div className="absolute bottom-0 h-1/2 w-2 bg-white/50 z-0" style={{ left: `${(ROAD.STOP_LINE_XELA / ROAD.LENGTH) * 100}%` }}></div>
                <div className="absolute top-0 h-1/2 w-2 bg-white/50 z-0" style={{ left: `${(ROAD.STOP_LINE_REU / ROAD.LENGTH) * 100}%` }}></div>
             </>
         )}
      </div>

      {/* ZONA DE SOCAVAMIENTO */}
      {scenarioMode !== 'OPTIMISTA' && (
          <div 
            className="absolute bottom-[23%] z-10 h-24 flex items-center justify-center pointer-events-none"
            style={{
                left: `${(ROAD.BOTTLENECK_START / ROAD.LENGTH) * 100}%`,
                width: `${((ROAD.BOTTLENECK_END - ROAD.BOTTLENECK_START) / ROAD.LENGTH) * 100}%`
            }}
          >
            <div className="w-full h-full bg-stone-900 rounded-[2rem] border-b-8 border-red-900 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dirt.png')] opacity-60"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Construction className="text-white opacity-50 w-8 h-8" />
                </div>
            </div>
            <div className="absolute -top-6 left-0 flex space-x-8 w-full justify-center">
                <AlertTriangle className="text-orange-500 animate-bounce" />
            </div>
          </div>
      )}

      {/* SEMÁFOROS */}
      {scenarioMode !== 'OPTIMISTA' && (
          <>
            <div className="absolute bottom-8 z-30 flex flex-col items-center" style={{ left: `${(ROAD.STOP_LINE_XELA / ROAD.LENGTH) * 100}%`, transform: 'translateX(-50%)' }}>
                <div className="bg-black p-1 rounded border border-gray-600 shadow-lg">
                    <div className={`w-3 h-3 rounded-full mb-1 transition-colors duration-300 ${trafficState.lightXela === 'RED' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`}></div>
                    <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${trafficState.lightXela === 'GREEN' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-green-900'}`}></div>
                </div>
            </div>
            <div className="absolute top-8 z-30 flex flex-col-reverse items-center" style={{ left: `${(ROAD.STOP_LINE_REU / ROAD.LENGTH) * 100}%`, transform: 'translateX(-50%)' }}>
                <div className="bg-black p-1 rounded border border-gray-600 shadow-lg">
                    <div className={`w-3 h-3 rounded-full mb-1 transition-colors duration-300 ${trafficState.lightReu === 'RED' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-red-900'}`}></div>
                    <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${trafficState.lightReu === 'GREEN' ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-green-900'}`}></div>
                </div>
            </div>
          </>
      )}

      {/* VEHÍCULOS */}
      {vehicles.map((v) => {
        let laneY = v.direction === 'TO_REU' ? 25 : 75; 
        
        if (scenarioMode !== 'OPTIMISTA' && v.direction === 'TO_XELA' && v.x > ROAD.BOTTLENECK_START && v.x < ROAD.BOTTLENECK_END) {
            laneY = 25; 
        }

        let overtakeOffset = 0;
        if (v.isOvertaking) {
            if (v.direction === 'TO_XELA') overtakeOffset = -15; 
            if (v.direction === 'TO_REU') overtakeOffset = 15;
        }

        return (
            <div
            key={v.uid}
            className={`absolute transition-transform duration-100 ease-linear z-20 ${v.color}`}
            style={{
                top: `${laneY + overtakeOffset}%`,
                left: `${(v.x / ROAD.LENGTH) * 100}%`,
                transform: `translate(-50%, -50%) ${v.direction === 'TO_REU' ? 'scaleX(-1)' : 'scaleX(1)'}`,
                zIndex: v.isOvertaking ? 40 : 20
            }}
            >
             <div className="relative flex items-center justify-center group">
                {renderVehicleBody(v)}
                
                {/* Indicador de Accidente */}
                {v.status === 'CRASHED' && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce">
                        <Flame size={20} className="text-red-500 fill-orange-500" />
                    </div>
                )}

                {/* Luces de freno */}
                {v.status === 'STOPPED' && (
                    <div className={`absolute w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_8px_red] animate-pulse ${v.direction === 'TO_XELA' ? '-left-2' : '-right-2'}`}></div>
                )}
             </div>
            </div>
        );
      })}
    </div>
  );
};

export default RoadVisualizer;