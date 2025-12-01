// src/simulation/engine.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { VEHICLE_TYPES, ROAD, SCENARIOS, CARGO_TYPES, COSTS } from './constants';

export const useSimulationEngine = (activeScenario, isRunning, config, resetSignal) => {
  // Estado Principal
  const [vehicles, setVehicles] = useState([]);
  const [trafficState, setTrafficState] = useState({ lightXela: 'GREEN', lightReu: 'GREEN', phase: 'OPEN' });
  const [simTime, setSimTime] = useState(null);
  const [dayCount, setDayCount] = useState(1);
  const [currentRisk, setCurrentRisk] = useState(0); 

  // Datos acumulados
  const [stats, setStats] = useState({ 
      totalCost: 0, 
      avgSpeed: 0, 
      stoppedCount: 0,
      totalVehiclesProcessed: 0
  });

  // Alertas
  const [accidentReport, setAccidentReport] = useState(null);
  const [breakdownAlert, setBreakdownAlert] = useState(null);
  
  // Históricos
  const historyLog = useRef([]); 
  const accidentLog = useRef([]);
  
  // Referencias internas
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
    if (r > 0.85) typeKey = 'TRUCK';
    else if (r > 0.70) typeKey = 'BUS';
    else if (r > 0.50) typeKey = 'PICKUP'; 
    else if (r > 0.20) typeKey = 'MOTO'; 

    const proto = VEHICLE_TYPES[typeKey];
    const startX = direction === 'TO_XELA' ? -100 : ROAD.LENGTH + 100;
    
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
        v: proto.maxSpeed * 0.8,
        a: 0,
        ...proto,
        status: 'MOVING',
        cargo,
        entryTime: Date.now(),
        crashTime: null,
        stoppedTime: 0,
        accumulatedCost: 0 
    };
  }, []);

  // --- LOOP PRINCIPAL ---
  useEffect(() => {
    if (!isRunning || !simTime) return;
    
    const timeStep = 0.1 * config.timeScale; 

    const interval = setInterval(() => {
      // 1. RELOJ DE SIMULACIÓN
      clockTickRef.current += 1;
      if (clockTickRef.current >= (10 / config.timeScale)) { 
          clockTickRef.current = 0;
          setSimTime(prev => {
              const newTime = new Date(prev.getTime() + 60000); // +1 minuto
              if (newTime.getHours() === 0 && newTime.getMinutes() === 0) setDayCount(d => d + 1);
              
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

      // 2. CONTROL DE SEMÁFOROS
      if (activeScenario.mode === 'REVERSIBLE') {
          const cycleTime = config.greenDuration * 10; 
          
          if (currentPhase.current === 'OPEN') { 
              currentPhase.current = 'TO_XELA'; 
              phaseTimer.current = cycleTime; 
          }

          phaseTimer.current -= 1 * config.timeScale;

          const checkEmpty = () => !vehicles.some(v => v.x > ROAD.BOTTLENECK_START && v.x < ROAD.BOTTLENECK_END);

          if (currentPhase.current === 'TO_XELA') {
              setTrafficState({ lightXela: 'GREEN', lightReu: 'RED', phase: 'PASO A XELA' });
              if (phaseTimer.current <= 0) { currentPhase.current = 'CLEARING_XELA'; phaseTimer.current = 500; } 
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

      // 3. CÁLCULO DE FLUJO, DENSIDAD Y RIESGO POR HORARIO (LÓGICA NUEVA)
      const currentHour = simTime.getHours();
      const currentMin = simTime.getMinutes();
      const decimalTime = currentHour + (currentMin / 60); // Hora en decimal (ej: 7.5 para 7:30)

      let trafficDensity = 0.1; // Base baja (madrugada)
      let timeRiskBase = 2;     // Riesgo base muy bajo

      // LÓGICA DE HORARIOS SEGÚN TUS INSTRUCCIONES:
      
      // A. Madrugada y Noche Tarde (20:00 - 07:30)
      if (decimalTime >= 20.0 || decimalTime < 7.5) {
          trafficDensity = 0.08; // Casi nulo
          timeRiskBase = 1;      // Riesgo mínimo
      }
      // B. Mañana Alta (07:30 - 10:00)
      else if (decimalTime >= 7.5 && decimalTime < 10.0) {
          trafficDensity = 1.4; // Tráfico pesado
          timeRiskBase = 55;    // Riesgo alto
      }
      // C. Valle Mañana (10:00 - 12:30) -> Disminuye
      else if (decimalTime >= 10.0 && decimalTime < 12.5) {
          trafficDensity = 0.6; 
          timeRiskBase = 20; 
      }
      // D. Mediodía (12:30 - 15:00) -> Aumenta
      else if (decimalTime >= 12.5 && decimalTime < 15.0) {
          trafficDensity = 1.0; 
          timeRiskBase = 45;
      }
      // E. Valle Tarde (15:00 - 18:00) -> Disminuye
      else if (decimalTime >= 15.0 && decimalTime < 18.0) {
          trafficDensity = 0.7; 
          timeRiskBase = 25;
      }
      // F. Noche Pico (18:00 - 20:00) -> Aumenta Más (Máximo)
      else if (decimalTime >= 18.0 && decimalTime < 20.0) {
          trafficDensity = 1.6; // Muy pesado
          timeRiskBase = 75;    // Riesgo máximo
      }

      // GENERACIÓN DE VEHÍCULOS (Usando la densidad calculada arriba)
      // La lluvia reduce un poco la aparición de coches (gente se guarda)
      const spawnRate = 0.02 * activeScenario.factor * trafficDensity * (1 - (config.rainIntensity * 0.02)) * config.timeScale;
      
      if (Math.random() < spawnRate) setVehicles(prev => [...prev, spawnVehicle('TO_XELA')]);
      if (Math.random() < spawnRate) setVehicles(prev => [...prev, spawnVehicle('TO_REU')]);


      // CÁLCULO FINAL DE RIESGO
      // Riesgo Base Hora + Lluvia (x8) + Escenario + Oscilación Random
      const rainRisk = config.rainIntensity * 8; // Si llueve al 10, suma 80% de riesgo
      const scenarioRisk = activeScenario.id === 'PESIMISTA' ? 15 : 0;
      const fluctuation = (Math.random() * 4) - 2; // Oscilación +/- 2%

      let totalCalculatedRisk = timeRiskBase + rainRisk + scenarioRisk + fluctuation;

      // EXCEPCIÓN: Si es madrugada (sin tráfico) y NO llueve, forzamos riesgo casi 0
      if ((decimalTime >= 20.0 || decimalTime < 7.5) && config.rainIntensity === 0) {
          totalCalculatedRisk = Math.random() * 2; // Entre 0 y 2%
      }

      setCurrentRisk(Math.min(100, Math.max(0, totalCalculatedRisk)));


      // 4. FÍSICA Y MOVIMIENTO
      let costTick = 0;
      let totalSpeed = 0;
      let stopped = 0;

      setVehicles(prevVehicles => {
        const xelaFlow = prevVehicles.filter(v => v.direction === 'TO_XELA').sort((a,b) => a.x - b.x);
        const reuFlow = prevVehicles.filter(v => v.direction === 'TO_REU').sort((a,b) => b.x - a.x); 

        const updateCar = (v, leader, trafficLightState) => {
            if (v.status === 'CRASHED' || v.status === 'BROKEN_DOWN') {
                if (Date.now() - v.crashTime > ROAD.ACCIDENT_DURATION) return null; 
                return v;
            }

            // IDM Lógica
            const maxV = v.maxSpeed * (1 - (config.rainIntensity * 0.05)); 
            let desiredGap = ROAD.SAFE_DISTANCE;
            let currentGap = 10000; 
            let dV = 0; 

            if (leader) {
                currentGap = Math.abs(leader.x - v.x) - leader.length;
                dV = v.v - leader.v;
            }

            let stopPoint = null;
            if (v.direction === 'TO_XELA' && trafficLightState === 'RED') stopPoint = ROAD.STOP_LINE_XELA;
            if (v.direction === 'TO_REU' && trafficLightState === 'RED') stopPoint = ROAD.STOP_LINE_REU;

            if (stopPoint) {
                const distToStop = v.direction === 'TO_XELA' ? (stopPoint - v.x) : (v.x - stopPoint);
                if (distToStop > 0 && distToStop < 200) { 
                    if (distToStop < currentGap) {
                        currentGap = distToStop;
                        dV = v.v - 0;
                    }
                }
            }

            const sStar = ROAD.SAFE_DISTANCE + (v.v * ROAD.TIME_HEADWAY) + ((v.v * dV) / (2 * Math.sqrt(v.accel * v.decel)));
            let accelTerm = v.accel * (1 - Math.pow(v.v / maxV, 4) - Math.pow(sStar / currentGap, 2));
            accelTerm += (Math.random() - 0.5) * 0.5;

            let newV = v.v + (accelTerm * timeStep);
            if (newV < 0) newV = 0;
            
            const dx = newV * timeStep * 2; 
            let newX = v.direction === 'TO_XELA' ? v.x + dx : v.x - dx;

            // EVENTOS ESTOCÁSTICOS
            let newStatus = 'MOVING';
            let crashTime = null;

            if (v.direction === 'TO_XELA' && v.type === 'TRUCK' && newV < 10 && newV > 0) {
                 if (Math.random() < 0.0005 * activeScenario.factor) {
                     newStatus = 'BROKEN_DOWN';
                     crashTime = Date.now();
                     setBreakdownAlert({ type: 'Tráiler con Embrague Quemado', location: 'Pendiente Km 194' });
                 }
            }

            // Probabilidad de Choque
            let crashProb = 0.00001 + (config.rainIntensity * 0.00005);
            if (currentGap < 5 && dV > 10) crashProb = 0.05; 
            
            // --- LÓGICA CHOQUE CON HERIDOS ---
            if (Math.random() < crashProb && v.status === 'MOVING') {
                newStatus = 'CRASHED';
                crashTime = Date.now();
                const loss = Math.round((v.cargo?.value || 0) + 10000);
                
                // Cálculo de heridos
                const passengers = v.passengers || 1;
                const injuredCount = Math.floor(Math.random() * (passengers + 1));

                const report = {
                    id: Date.now(),
                    time: simTime.toLocaleTimeString(),
                    type: v.type, 
                    cause: config.rainIntensity > 5 ? 'Derrape por Lluvia' : 'Colisión por Alcance',
                    cost: loss,
                    passengers: passengers, 
                    injured: injuredCount   
                };
                setAccidentReport(report);
                accidentLog.current.push(report);
            }

            // Costos
            let vehicleCostTick = 0;
            if (newV < 1) {
                stopped++;
                vehicleCostTick += (COSTS.OPPORTUNITY_COST_TRUCK / 3600) * timeStep;
                vehicleCostTick += (v.passengers * COSTS.TIME_VALUE_PASSENGER / 3600) * timeStep;
            } else {
                vehicleCostTick += (COSTS.FUEL_MOVING_PER_KM / 1000) * dx;
            }

            costTick += vehicleCostTick;
            totalSpeed += newV;

            return { 
                ...v, 
                x: newX, 
                v: newV, 
                status: newStatus, 
                crashTime: crashTime || v.crashTime,
                accumulatedCost: (v.accumulatedCost || 0) + vehicleCostTick
            };
        };

        const nextXela = [];
        for (let i = 0; i < xelaFlow.length; i++) {
            const updated = updateCar(xelaFlow[i], xelaFlow[i+1], trafficState.lightXela); 
            if (updated && updated.x < ROAD.LENGTH + 100) nextXela.push(updated);
        }

        const nextReu = [];
        for (let i = 0; i < reuFlow.length; i++) {
            const updated = updateCar(reuFlow[i], reuFlow[i+1], trafficState.lightReu); 
            if (updated && updated.x > -100) nextReu.push(updated);
        }

        return [...nextXela, ...nextReu];
      });

      setStats(prev => ({
          totalCost: prev.totalCost + costTick,
          avgSpeed: vehicles.length > 0 ? (totalSpeed / vehicles.length) * 3.6 : 0, 
          stoppedCount: stopped,
          totalVehiclesProcessed: prev.totalVehiclesProcessed
      }));

    }, 50); 

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
      historyLog,
      accidentLog 
  };
};