// src/simulation/engine.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { VEHICLE_TYPES, ROAD, SCENARIOS, CARGO_TYPES, COSTS } from './constants';

export const useSimulationEngine = (activeScenario, isRunning, config, resetSignal) => {
  // Estado Principal
  const [vehicles, setVehicles] = useState([]);
  const [trafficState, setTrafficState] = useState({ lightXela: 'GREEN', lightReu: 'GREEN', phase: 'OPEN' });
  const [simTime, setSimTime] = useState(null);
  const [dayCount, setDayCount] = useState(1);
  const [currentRisk, setCurrentRisk] = useState(0); // Probabilidad actual de accidente (0-100%)

  // Datos acumulados para visualización
  const [stats, setStats] = useState({ 
      totalCost: 0, 
      avgSpeed: 0, 
      stoppedCount: 0,
      totalVehiclesProcessed: 0
  });

  // Alertas
  const [accidentReport, setAccidentReport] = useState(null);
  const [breakdownAlert, setBreakdownAlert] = useState(null);
  
  // Históricos para Exportación (Refs para no causar re-renders masivos)
  const historyLog = useRef([]); 
  const accidentLog = useRef([]);
  
  // Referencias internas del motor
  const phaseTimer = useRef(0);
  const currentPhase = useRef('OPEN');
  const clockTickRef = useRef(0); 

  // --- INICIALIZACIÓN ---
  useEffect(() => {
    setVehicles([]);
    setStats({ totalCost: 0, avgSpeed: 0, stoppedCount: 0, totalVehiclesProcessed: 0 });
    setAccidentReport(null);
    setBreakdownAlert(null);
    historyLog.current = [];
    accidentLog.current = [];
    setDayCount(1);
    setCurrentRisk(0);
    
    if (config.startHour) {
        const [h, m] = config.startHour.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        setSimTime(date);
    }
  }, [resetSignal, config.startHour]);

  // Limpieza de alertas
  useEffect(() => {
    if (accidentReport) { const t = setTimeout(() => setAccidentReport(null), 6000); return () => clearTimeout(t); }
  }, [accidentReport]);
  
  useEffect(() => {
    if (breakdownAlert) { const t = setTimeout(() => setBreakdownAlert(null), 5000); return () => clearTimeout(t); }
  }, [breakdownAlert]);

  // --- GENERADOR DE VEHÍCULOS ---
  const spawnVehicle = useCallback((direction) => {
    const r = Math.random();
    let typeKey = 'CAR';
    // Probabilidades ajustadas según realidad guatemalteca
    if (r > 0.85) typeKey = 'TRUCK';
    else if (r > 0.70) typeKey = 'BUS';
    else if (r > 0.50) typeKey = 'PICKUP'; 
    else if (r > 0.20) typeKey = 'MOTO'; 

    const proto = VEHICLE_TYPES[typeKey];
    const startX = direction === 'TO_XELA' ? -100 : ROAD.LENGTH + 100;
    
    // Carga Aleatoria
    let cargo = null;
    if (proto.isCargo) {
        const cTemplate = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
        cargo = { ...cTemplate, currentValue: cTemplate.value * (0.8 + Math.random()*0.4) };
    }

    return {
        uid: Date.now() + Math.random(),
        type: typeKey,
        direction,
        x: startX,
        v: proto.maxSpeed * 0.8, // Velocidad actual
        a: 0, // Aceleración actual
        ...proto,
        status: 'MOVING',
        cargo,
        entryTime: Date.now(),
        crashTime: null,
        stoppedTime: 0 // ms detenido
    };
  }, []);

  // --- LOOP PRINCIPAL ---
  useEffect(() => {
    if (!isRunning || !simTime) return;
    
    // El timeScale afecta qué tan rápido pasa el tiempo simulado vs real
    const timeStep = 0.1 * config.timeScale; // Delta time en segundos para física

    const interval = setInterval(() => {
      // 1. RELOJ DE SIMULACIÓN
      clockTickRef.current += 1;
      if (clockTickRef.current >= (10 / config.timeScale)) { 
          clockTickRef.current = 0;
          setSimTime(prev => {
              const newTime = new Date(prev.getTime() + 60000); // +1 minuto
              if (newTime.getHours() === 0 && newTime.getMinutes() === 0) setDayCount(d => d + 1);
              
              // Guardar Log cada 10 minutos simulados para no saturar memoria
              if (newTime.getMinutes() % 10 === 0) {
                  historyLog.current.push({
                      time: newTime.toLocaleTimeString(),
                      day: dayCount,
                      vehicles: vehicles.length,
                      avgSpeed: stats.avgSpeed,
                      totalCost: stats.totalCost,
                      weather: config.rainIntensity
                  });
              }
              return newTime;
          });
      }

      // 2. CONTROL DE SEMÁFOROS (LÓGICA DE CUELLO DE BOTELLA)
      if (activeScenario.mode === 'REVERSIBLE') {
          const cycleTime = config.greenDuration * 10; // Escalar duración
          
          if (currentPhase.current === 'OPEN') { 
              currentPhase.current = 'TO_XELA'; 
              phaseTimer.current = cycleTime; 
          }

          phaseTimer.current -= 1 * config.timeScale;

          const checkEmpty = () => !vehicles.some(v => v.x > ROAD.BOTTLENECK_START && v.x < ROAD.BOTTLENECK_END);

          if (currentPhase.current === 'TO_XELA') {
              setTrafficState({ lightXela: 'GREEN', lightReu: 'RED', phase: 'PASO A XELA' });
              if (phaseTimer.current <= 0) { currentPhase.current = 'CLEARING_XELA'; phaseTimer.current = 500; } // Tiempo de despeje fijo
          } 
          else if (currentPhase.current === 'CLEARING_XELA') {
              setTrafficState({ lightXela: 'RED', lightReu: 'RED', phase: 'DESPEJE' });
              if (checkEmpty() || phaseTimer.current <= 0) { currentPhase.current = 'TO_REU'; phaseTimer.current = cycleTime; }
          }
          else if (currentPhase.current === 'TO_REU') {
              setTrafficState({ lightXela: 'RED', lightReu: 'GREEN', phase: 'PASO A REU' });
              if (phaseTimer.current <= 0) { currentPhase.current = 'CLEARING_REU'; phaseTimer.current = 500; }
          }
          else if (currentPhase.current === 'CLEARING_REU') {
              setTrafficState({ lightXela: 'RED', lightReu: 'RED', phase: 'DESPEJE' });
              if (checkEmpty() || phaseTimer.current <= 0) { currentPhase.current = 'TO_XELA'; phaseTimer.current = cycleTime; }
          }
      } else {
          setTrafficState({ lightXela: 'GREEN', lightReu: 'GREEN', phase: 'LIBRE' });
      }

      // 3. GENERACIÓN DE TRÁFICO (SPAWN)
      // Densidad basada en hora pico
      const h = simTime.getHours();
      let density = 0.5;
      if ((h >= 6 && h <= 9) || (h >= 16 && h <= 19)) density = 1.2; // Hora Pico
      if (h >= 22 || h <= 4) density = 0.1; // Madrugada

      // Lluvia reduce generación (gente sale menos) pero aumenta caos
      const spawnRate = 0.02 * activeScenario.factor * density * (1 - (config.rainIntensity * 0.02)) * config.timeScale;
      
      if (Math.random() < spawnRate) setVehicles(prev => [...prev, spawnVehicle('TO_XELA')]);
      if (Math.random() < spawnRate) setVehicles(prev => [...prev, spawnVehicle('TO_REU')]);

      // 4. CÁLCULO DE RIESGO
      // El riesgo sube con: lluvia, velocidad promedio alta o muy baja (stop&go), densidad
      const riskFactor = (config.rainIntensity * 5) + (vehicles.length * 0.5) + (activeScenario.id === 'PESIMISTA' ? 20 : 0);
      setCurrentRisk(Math.min(100, Math.max(0, riskFactor)));


      // 5. FÍSICA Y MOVIMIENTO (IDM Simplificado)
      let costTick = 0;
      let totalSpeed = 0;
      let stopped = 0;

      setVehicles(prevVehicles => {
        // Separar carriles y ordenar por posición para saber quién va adelante
        const xelaFlow = prevVehicles.filter(v => v.direction === 'TO_XELA').sort((a,b) => a.x - b.x);
        const reuFlow = prevVehicles.filter(v => v.direction === 'TO_REU').sort((a,b) => b.x - a.x); // Inverso porque van al revés

        const updateCar = (v, leader, trafficLightState) => {
            if (v.status === 'CRASHED' || v.status === 'BROKEN_DOWN') {
                if (Date.now() - v.crashTime > ROAD.ACCIDENT_DURATION) return null; // Eliminar choque viejo
                return v;
            }

            // --- Lógica de Aceleración (IDM) ---
            const maxV = v.maxSpeed * (1 - (config.rainIntensity * 0.05)); // Lluvia reduce vel max
            let desiredGap = ROAD.SAFE_DISTANCE;
            let currentGap = 10000; // Infinito por defecto
            let dV = 0; // Diferencia de velocidad

            // 1. Detección de Líder (Coche enfrente)
            if (leader) {
                currentGap = Math.abs(leader.x - v.x) - leader.length;
                dV = v.v - leader.v;
            }

            // 2. Detección de Semáforo/Bloqueo
            let stopPoint = null;
            if (v.direction === 'TO_XELA' && trafficLightState === 'RED') stopPoint = ROAD.STOP_LINE_XELA;
            if (v.direction === 'TO_REU' && trafficLightState === 'RED') stopPoint = ROAD.STOP_LINE_REU;

            if (stopPoint) {
                const distToStop = v.direction === 'TO_XELA' ? (stopPoint - v.x) : (v.x - stopPoint);
                if (distToStop > 0 && distToStop < 200) { // Si ve el semáforo
                    // Tratamos el semáforo como un coche parado velocidad 0 en la línea
                    if (distToStop < currentGap) {
                        currentGap = distToStop;
                        dV = v.v - 0;
                    }
                }
            }

            // Ecuación IDM simplificada para aceleración
            // s* = s0 + v*T + (v*dv) / (2*sqrt(a*b))
            const sStar = ROAD.SAFE_DISTANCE + (v.v * ROAD.TIME_HEADWAY) + ((v.v * dV) / (2 * Math.sqrt(v.accel * v.decel)));
            let accelTerm = v.accel * (1 - Math.pow(v.v / maxV, 4) - Math.pow(sStar / currentGap, 2));

            // Ruido aleatorio humano (imperfección al conducir)
            accelTerm += (Math.random() - 0.5) * 0.5;

            // Actualizar Velocidad y Posición
            let newV = v.v + (accelTerm * timeStep);
            if (newV < 0) newV = 0;
            
            // Movimiento
            const dx = newV * timeStep * 2; // *2 factor visual para que no sea tan lento en pantalla
            let newX = v.direction === 'TO_XELA' ? v.x + dx : v.x - dx;

            // --- EVENTOS ESTOCÁSTICOS (Choques/Fallas) ---
            let newStatus = 'MOVING';
            let crashTime = null;

            // Falla Mecánica en subida (asumiendo Xela es subida)
            if (v.direction === 'TO_XELA' && v.type === 'TRUCK' && newV < 10 && newV > 0) {
                 // Riesgo aumenta drásticamente en frenado/arranque
                 if (Math.random() < 0.0005 * activeScenario.factor) {
                     newStatus = 'BROKEN_DOWN';
                     crashTime = Date.now();
                     setBreakdownAlert({ type: 'Tráiler con Embrague Quemado', location: 'Pendiente Km 194' });
                 }
            }

            // Accidente por alcance o imprudencia
            // Riesgo base + Lluvia
            let crashProb = 0.00001 + (config.rainIntensity * 0.00005);
            // Si hay mucha diferencia de velocidad con el lider y muy cerca
            if (currentGap < 5 && dV > 10) crashProb = 0.05; 
            
            if (Math.random() < crashProb && v.status === 'MOVING') {
                newStatus = 'CRASHED';
                crashTime = Date.now();
                const loss = Math.round((v.cargo?.value || 0) + 10000);
                const report = {
                    id: Date.now(),
                    time: simTime.toLocaleTimeString(),
                    type: v.type,
                    cause: config.rainIntensity > 5 ? 'Derrape por Lluvia' : 'Colisión por Alcance',
                    cost: loss
                };
                setAccidentReport(report);
                accidentLog.current.push(report);
            }

            // Cálculos Económicos
            if (newV < 1) {
                stopped++;
                costTick += (COSTS.OPPORTUNITY_COST_TRUCK / 3600) * timeStep; // Si es camión cuesta más
                costTick += (v.passengers * COSTS.TIME_VALUE_PASSENGER / 3600) * timeStep;
            } else {
                costTick += (COSTS.FUEL_MOVING_PER_KM / 1000) * dx;
            }
            totalSpeed += newV;

            return { 
                ...v, 
                x: newX, 
                v: newV, 
                status: newStatus, 
                crashTime: crashTime || v.crashTime 
            };
        };

        const nextXela = [];
        for (let i = 0; i < xelaFlow.length; i++) {
            const updated = updateCar(xelaFlow[i], xelaFlow[i+1], trafficState.lightXela); // i+1 es el de adelante en Xela
            if (updated && updated.x < ROAD.LENGTH + 100) nextXela.push(updated);
        }

        const nextReu = [];
        for (let i = 0; i < reuFlow.length; i++) {
            const updated = updateCar(reuFlow[i], reuFlow[i+1], trafficState.lightReu); // i+1 es el de adelante en Reu (orden inverso)
            if (updated && updated.x > -100) nextReu.push(updated);
        }

        return [...nextXela, ...nextReu];
      });

      // Actualizar Estadísticas Globales
      setStats(prev => ({
          totalCost: prev.totalCost + costTick,
          avgSpeed: vehicles.length > 0 ? (totalSpeed / vehicles.length) * 3.6 : 0, // km/h
          stoppedCount: stopped,
          totalVehiclesProcessed: prev.totalVehiclesProcessed
      }));

    }, 50); // Loop a 20 FPS aprox

    return () => clearInterval(interval);
  }, [isRunning, simTime, config, activeScenario, trafficState]);

  return { 
      vehicles, 
      trafficState, 
      simTime, 
      dayCount, 
      stats, 
      currentRisk,
      accidentReport, 
      breakdownAlert,
      historyLog,  // Exponemos los refs para exportación
      accidentLog 
  };
};