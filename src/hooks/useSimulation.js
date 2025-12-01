import { useState, useEffect, useRef } from 'react';
import { VEHICLE_TYPES, COSTS } from '../simulation/constants';

export const useSimulation = (scenario, isRunning) => {
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({
    totalCost: 0,
    waitingTime: 0,
    fuelConsumed: 0,
    cargoLoss: 0,
    queueLength: 0
  });
  const [trafficLight, setTrafficLight] = useState('GREEN'); // GREEN, RED
  const [weather, setWeather] = useState('SUNNY'); // SUNNY, RAIN
  
  const tickRef = useRef(0);

  // Generador de Vehículos (Llegada de Poisson simplificada)
  const spawnVehicle = () => {
    const types = Object.keys(VEHICLE_TYPES);
    const typeKey = types[Math.floor(Math.random() * types.length)];
    const type = VEHICLE_TYPES[typeKey];
    
    return {
      id: Date.now() + Math.random(),
      type: typeKey,
      position: 0, // 0 metros (inicio del tramo)
      speed: type.speed,
      status: 'MOVING', // MOVING, WAITING, CRASHED
      entryTime: Date.now(),
      cargoValue: type.cargoValue || 0,
      waitTime: 0
    };
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      tickRef.current += 1;
      
      // 1. Lógica del Semáforo (Paso Regulado - Km 194)
      // Ciclo de 20 segundos para demo (en realidad son minutos)
      const cycleTime = scenario === 'REAL' || scenario === 'PESIMISTA' ? 200 : 0; 
      if (cycleTime > 0) {
        const phase = tickRef.current % (cycleTime * 2);
        setTrafficLight(phase < cycleTime ? 'GREEN' : 'RED');
      } else {
        setTrafficLight('GREEN');
      }

      // 2. Generar vehículos aleatoriamente
      // Más probabilidad de vehículos en horas pico (simulado aleatoriamente aquí)
      if (Math.random() < 0.1 * scenario.factor) { 
        setVehicles(prev => [...prev, spawnVehicle()]);
      }

      // 3. Mover vehículos y Calcular Física
      setVehicles(prevVehicles => {
        return prevVehicles.map((v, index) => {
          const vehicleData = VEHICLE_TYPES[v.type];
          let newSpeed = vehicleData.speed;
          let status = 'MOVING';

          // Factor Clima (Lluvia reduce velocidad)
          if (weather === 'RAIN') newSpeed *= 0.6;

          // Distancia al vehículo de adelante (Lógica de Colas)
          const nextVehicle = prevVehicles[index - 1]; // El que va adelante (array ordenado por posición)
          const distanceToNext = nextVehicle ? nextVehicle.position - v.position : 9999;

          // Lógica de Parada (Semáforo o Cola)
          // El tramo del socavamiento está digamos en el metro 800
          const distToSocavamiento = 800 - v.position;

          if (trafficLight === 'RED' && distToSocavamiento > 0 && distToSocavamiento < 50) {
            newSpeed = 0;
            status = 'WAITING';
          } else if (distanceToNext < 15) { // Distancia de seguridad
            newSpeed = 0;
            status = 'WAITING';
          }

          // Calcular avance
          const newPos = v.position + (newSpeed / 3.6) * 0.1; // km/h a m/s * dt

          // Actualizar acumuladores del vehículo individual
          const isWaiting = newSpeed === 0;
          
          return {
            ...v,
            position: newPos,
            speed: newSpeed,
            status: status,
            waitTime: isWaiting ? v.waitTime + 1 : v.waitTime
          };
        }).filter(v => v.position < 2000); // Eliminar vehículos que pasaron el tramo (2km)
      });

      // 4. Calcular Estadísticas Globales (Costos)
      setStats(prev => {
        // Costo Operativo = (Vehículos parados * Costo Hora)
        // Costo Combustible = (Vehículos moviéndose * Consumo) + (Parados * Ralentí)
        const waitingVehicles = vehicles.filter(v => v.speed === 0);
        const movingVehicles = vehicles.filter(v => v.speed > 0);
        
        // Sumar costos (Simplificado por tick)
        const tickCostTime = waitingVehicles.reduce((acc, v) => acc + (VEHICLE_TYPES[v.type].costPerHour / 3600), 0);
        const tickFuel = movingVehicles.length * 0.05; // ml de gasolina por tick
        
        // Costo Riesgo (Perecedero) - Verduras de Almolonga
        // Si waitTime > umbral, costo explota
        const riskCost = waitingVehicles.reduce((acc, v) => {
           // Si espera mucho (simulado > 100 ticks), aplica penalización de perecedero
           return v.type === 'TRUCK' && v.waitTime > 100 ? acc + (COSTS.PERISHABLE_LOSS_RATE / 3600) : acc;
        }, 0);

        return {
          totalCost: prev.totalCost + tickCostTime + riskCost,
          waitingTime: prev.waitingTime + waitingVehicles.length,
          fuelConsumed: prev.fuelConsumed + tickFuel,
          cargoLoss: prev.cargoLoss + riskCost,
          queueLength: waitingVehicles.length
        };
      });

    }, 100); // 100ms refresh rate

    return () => clearInterval(interval);
  }, [isRunning, scenario, weather, vehicles.length, trafficLight]);

  return { vehicles, stats, trafficLight, weather, setWeather };
};