// src/simulation/engine.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { VEHICLE_TYPES, ROAD, RUSH_HOURS, ACCIDENT_RATES, CARGO_TYPES } from './constants';

const generateAccidentDetails = (vehicleType) => {
    // (Esta función se mantiene igual, se usa para los reportes de accidentes)
    const vInfo = Object.values(VEHICLE_TYPES).find(t => t.id === vehicleType.toLowerCase()) || VEHICLE_TYPES.CAR;
    const maxPax = vInfo.passengers || 2;
    const passengersOnBoard = Math.floor(Math.random() * maxPax) + 1; 
    const injured = Math.floor(passengersOnBoard * 0.3 * Math.random());
    const hospitalized = Math.floor(injured * 0.5 * Math.random());
    let vehicleCost = 0;
    let cargoLoss = 0;
    let cargoDesc = "N/A";

    if (vInfo.id === 'moto') vehicleCost = 5000;
    else if (vInfo.id === 'car') vehicleCost = 45000;
    else if (vInfo.id === 'pickup') vehicleCost = 85000;
    else if (vInfo.id === 'bus') vehicleCost = 280000;
    else if (vInfo.id === 'truck') {
        vehicleCost = 160000;
        const randomCargo = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
        cargoDesc = randomCargo.name;
        cargoLoss = randomCargo.value * (0.5 + Math.random() * 0.5);
    }
    return { passengers: passengersOnBoard, injured, hospitalized, materialLoss: vehicleCost, cargoLoss, cargoDesc };
};

export const useSimulationEngine = (activeScenario, isRunning, config, resetSignal) => {
  const [vehicles, setVehicles] = useState([]);
  const [accidentHistory, setAccidentHistory] = useState([]); 
  const [activeAlert, setActiveAlert] = useState(null); 
  const [breakdownAlert, setBreakdownAlert] = useState(null); 
  
  const [simTime, setSimTime] = useState(null);
  const [dayCount, setDayCount] = useState(1);

  const [trafficState, setTrafficState] = useState({ lightXela: 'GREEN', lightReu: 'GREEN', phase: 'OPEN' });

  const [stats, setStats] = useState({ totalCost: 0, fuelCost: 0, cargoCost: 0, stoppedVehicles: 0, averageSpeed: 0, avgWaitTime: 0 });
  
  const phaseTimer = useRef(0);
  const currentPhase = useRef('OPEN');
  const lastHourRef = useRef(-1); 
  const clockTickRef = useRef(0); 

  useEffect(() => {
    setVehicles([]);
    setStats({ totalCost: 0, fuelCost: 0, cargoCost: 0, stoppedVehicles: 0, averageSpeed: 0, avgWaitTime: 0 });
    setAccidentHistory([]);
    setActiveAlert(null);
    setBreakdownAlert(null);
    setDayCount(1);
    currentPhase.current = 'OPEN';
    setTrafficState({ lightXela: 'GREEN', lightReu: 'GREEN', phase: 'OPEN' });
    
    if (config.startHour) {
        const [h, m] = config.startHour.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        setSimTime(date);
        lastHourRef.current = h;
    }
  }, [resetSignal, config.startHour]);

  useEffect(() => {
    if (activeAlert) { const t = setTimeout(() => setActiveAlert(null), 5000); return () => clearTimeout(t); }
  }, [activeAlert]);
  
  useEffect(() => {
    if (breakdownAlert) { const t = setTimeout(() => setBreakdownAlert(null), 5000); return () => clearTimeout(t); }
  }, [breakdownAlert]);

  const getTrafficDensity = useCallback((dateObj) => {
      if (!dateObj) return 1;
      const currentHour = dateObj.getHours() + (dateObj.getMinutes() / 60);
      if (currentHour >= 21.0 || currentHour < 5.0) return 0.05; 
      const rush = RUSH_HOURS.find(r => currentHour >= r.start && currentHour <= r.end);
      let density = rush ? rush.factor : 0.6;
      if (config.rainIntensity > 6) density *= 0.6; 
      return density;
  }, [config.rainIntensity]);

  const spawnVehicle = useCallback((direction) => {
    const r = Math.random();
    let typeKey = 'CAR';
    if (r > 0.80) typeKey = 'TRUCK';
    else if (r > 0.65) typeKey = 'BUS';
    else if (r > 0.45) typeKey = 'PICKUP'; 
    else if (r > 0.15) typeKey = 'CAR'; 
    else typeKey = 'MOTO'; 

    const vConfig = VEHICLE_TYPES[typeKey];
    const startX = direction === 'TO_XELA' ? -80 : ROAD.LENGTH + 80; 
    const rainSlowdown = 1 - (config.rainIntensity * 0.04); 
    const finalSpeed = vConfig.speed * rainSlowdown;

    // --- GENERACIÓN DE DATOS DETALLADOS DEL VEHÍCULO ---
    // 1. Pasajeros reales a bordo (entre 1 y capacidad máxima)
    const realPassengers = Math.floor(Math.random() * vConfig.passengers) + 1;
    
    // 2. Asignación de Carga
    let cargoDetails = null;
    let cargoValue = 0;
    
    // Camiones y Pickups siempre llevan carga. Buses llevan carga "parcial" (equipaje/encomiendas)
    if (vConfig.isCargo || typeKey === 'BUS') {
        const randomCargo = CARGO_TYPES[Math.floor(Math.random() * CARGO_TYPES.length)];
        // Si es bus, la carga vale menos (son maletas)
        const valueFactor = typeKey === 'BUS' ? 0.3 : (typeKey === 'PICKUP' ? 0.5 : 1.0);
        
        cargoDetails = {
            ...randomCargo,
            currentValue: randomCargo.value * valueFactor
        };
        cargoValue = cargoDetails.currentValue;
    }

    return {
        uid: Date.now() + Math.random(),
        type: typeKey,
        direction,
        x: startX,
        speed: finalSpeed, 
        maxSpeed: finalSpeed,
        currentSpeed: finalSpeed,
        status: 'MOVING',
        isOvertaking: false, 
        crashTime: null,
        entryTime: Date.now(),
        waitTime: 0,
        stressLevel: 0,
        fuelConsumed: 0, // Contador individual
        // Datos informativos
        info: {
            passengers: realPassengers,
            cargo: cargoDetails,
            totalValue: cargoValue + (typeKey === 'TRUCK' ? 150000 : 40000) // Valor aproximado del vehículo
        },
        ...vConfig
    };
  }, [config.rainIntensity]);

  useEffect(() => {
    if (!isRunning || !simTime) return;
    const timeMultiplier = config.timeScale || 1;

    const interval = setInterval(() => {
      clockTickRef.current += 1 * timeMultiplier;
      if (clockTickRef.current >= 4) { 
          clockTickRef.current = 0;
          setSimTime(prev => {
              if (!prev) return new Date();
              const newTime = new Date(prev.getTime() + 60000); 
              const newHour = newTime.getHours();
              if (lastHourRef.current === 23 && newHour === 0) setDayCount(d => d + 1);
              lastHourRef.current = newHour;
              return newTime;
          });
      }

      if (activeScenario.id === 'OPTIMISTA') {
          setTrafficState({ lightXela: 'GREEN', lightReu: 'GREEN', phase: 'OPEN' });
      } else {
        const GREEN_TIME = parseInt(config.greenDuration) || 400;
        if (currentPhase.current === 'OPEN') { currentPhase.current = 'FLOW_XELA'; phaseTimer.current = GREEN_TIME; }
        const tickDecrement = 1 * timeMultiplier;
        const isBottleneckEmpty = () => {
             const startCheck = ROAD.STOP_LINE_XELA + 10;
             const endCheck = ROAD.STOP_LINE_REU - 10;
             return !vehicles.some(v => v.x > startCheck && v.x < endCheck);
        };

        switch (currentPhase.current) {
            case 'FLOW_XELA':
                phaseTimer.current -= tickDecrement;
                setTrafficState({ lightXela: 'GREEN', lightReu: 'RED', phase: 'PASO A XELA' });
                if (phaseTimer.current <= 0) currentPhase.current = 'CLEARING_FROM_XELA';
                break;
            case 'CLEARING_FROM_XELA':
                setTrafficState({ lightXela: 'RED', lightReu: 'RED', phase: 'DESPEJE' });
                if (isBottleneckEmpty()) { currentPhase.current = 'FLOW_REU'; phaseTimer.current = GREEN_TIME; }
                break;
            case 'FLOW_REU':
                phaseTimer.current -= tickDecrement;
                setTrafficState({ lightXela: 'RED', lightReu: 'GREEN', phase: 'PASO A REU' });
                if (phaseTimer.current <= 0) currentPhase.current = 'CLEARING_FROM_REU';
                break;
            case 'CLEARING_FROM_REU':
                setTrafficState({ lightXela: 'RED', lightReu: 'RED', phase: 'DESPEJE' });
                if (isBottleneckEmpty()) { currentPhase.current = 'FLOW_XELA'; phaseTimer.current = GREEN_TIME; }
                break;
            default: break;
        }
      }

      const density = getTrafficDensity(simTime);
      const baseSpawnRate = 0.03 * activeScenario.factor * density * timeMultiplier;
      
      if (Math.random() < baseSpawnRate) setVehicles(prev => prev.some(v => v.direction === 'TO_XELA' && v.x < 10) ? prev : [...prev, spawnVehicle('TO_XELA')]);
      if (Math.random() < baseSpawnRate) setVehicles(prev => prev.some(v => v.direction === 'TO_REU' && v.x > ROAD.LENGTH - 10) ? prev : [...prev, spawnVehicle('TO_REU')]);

      // FÍSICA Y LOGICA
      setVehicles(prev => {
        const xelaLane = prev.filter(v => v.direction === 'TO_XELA').sort((a, b) => a.x - b.x);
        const reuLane = prev.filter(v => v.direction === 'TO_REU').sort((a, b) => b.x - a.x);

        const updateVehicle = (v, index, laneArray) => {
            if (v.status === 'CRASHED') return v; 
            if (v.status === 'BROKEN_DOWN') {
                if (Date.now() - v.crashTime > ROAD.BREAKDOWN_DURATION) return { ...v, x: -9999 };
                return v;
            }

            let targetSpeed = v.maxSpeed;

            if (activeScenario.id !== 'OPTIMISTA') {
                if (v.direction === 'TO_XELA' && trafficState.lightXela === 'RED') {
                    if (v.x < ROAD.STOP_LINE_XELA && (ROAD.STOP_LINE_XELA - v.x) < 150) targetSpeed = (ROAD.STOP_LINE_XELA - v.x) < 5 ? 0 : Math.min(targetSpeed, (ROAD.STOP_LINE_XELA - v.x) * 0.8);
                }
                if (v.direction === 'TO_REU' && trafficState.lightReu === 'RED') {
                    if (v.x > ROAD.STOP_LINE_REU && (v.x - ROAD.STOP_LINE_REU) < 150) targetSpeed = (v.x - ROAD.STOP_LINE_REU) < 5 ? 0 : Math.min(targetSpeed, (v.x - ROAD.STOP_LINE_REU) * 0.8);
                }
            }

            const vehicleAhead = laneArray[index + 1]; 
            const vehicleBehind = laneArray[index - 1]; 
            const oppositeLane = v.direction === 'TO_XELA' ? reuLane : xelaLane;

            let isOvertakingNow = v.isOvertaking; 
            let forceStop = false; 

            if (vehicleAhead) {
                let gap = 0;
                if (v.direction === 'TO_XELA') gap = (vehicleAhead.x - vehicleAhead.length) - v.x;
                else gap = v.x - (vehicleAhead.x + vehicleAhead.length);

                const requiredSafeDistance = ROAD.SAFE_DISTANCE + (v.currentSpeed * 0.5);
                const inDangerZone = activeScenario.id !== 'OPTIMISTA' && (v.x > ROAD.BOTTLENECK_START - 100 && v.x < ROAD.BOTTLENECK_END + 100);
                const rainCaution = config.rainIntensity > 5; 
                
                let isOppositeClear = true;
                if (!isOvertakingNow) {
                    const oncoming = oppositeLane.find(opp => {
                        if (v.direction === 'TO_XELA') return opp.x > v.x && opp.x < (v.x + ROAD.SIGHT_DISTANCE);
                        else return opp.x < v.x && opp.x > (v.x - ROAD.SIGHT_DISTANCE);
                    });
                    if (oncoming) isOppositeClear = false;
                }

                const overtakeIntent = Math.random() < 0.05;
                const shouldStartOvertake = config.allowOvertaking && v.canOvertake && overtakeIntent && !v.isOvertaking && !inDangerZone && !rainCaution && v.rank > vehicleAhead.rank && vehicleAhead.currentSpeed > 15 && isOppositeClear;

                if (gap < requiredSafeDistance) {
                    if (shouldStartOvertake) {
                         isOvertakingNow = true;
                         targetSpeed = Math.max(v.speed, vehicleAhead.currentSpeed + 12); 
                    } else if (gap < 2) {
                        targetSpeed = 0;
                        forceStop = true;
                    } else if (gap < 15) {
                        targetSpeed = 0;
                    } else if (v.isOvertaking) {
                        targetSpeed = v.maxSpeed * 1.1; 
                    } else {
                        targetSpeed = Math.min(targetSpeed, vehicleAhead.currentSpeed);
                    }
                } else if (gap < requiredSafeDistance * 2) {
                    if (!v.isOvertaking) targetSpeed = Math.min(targetSpeed, v.maxSpeed * 0.8);
                }
            }

            if (isOvertakingNow) {
                let potentialBehind, potentialAhead;
                if (v.direction === 'TO_XELA') {
                    potentialBehind = laneArray.filter(c => c.uid !== v.uid && c.x < v.x).pop(); 
                    potentialAhead = laneArray.find(c => c.uid !== v.uid && c.x > v.x); 
                } else {
                    potentialBehind = laneArray.filter(c => c.uid !== v.uid && c.x > v.x).pop(); 
                    potentialAhead = laneArray.find(c => c.uid !== v.uid && c.x < v.x); 
                }
                let gapBack = 999, gapFront = 999;
                if (potentialBehind) gapBack = Math.abs(v.x - potentialBehind.x) - (v.length/2 + potentialBehind.length/2);
                if (potentialAhead) gapFront = Math.abs(potentialAhead.x - v.x) - (v.length/2 + potentialAhead.length/2);
                if (gapBack > ROAD.OVERTAKE_BUFFER && gapFront > ROAD.OVERTAKE_BUFFER) isOvertakingNow = false; 
                else isOvertakingNow = true;
            }

            let newSpeed = v.currentSpeed;
            if (targetSpeed > v.currentSpeed) newSpeed += 2; 
            else if (targetSpeed < v.currentSpeed) newSpeed -= 4;
            if (newSpeed < 0) newSpeed = 0;

            // Consumo de combustible individual (gal/hora aprox)
            let fuelTick = 0;
            if (newSpeed === 0) fuelTick = 0.0001; // Ralentí
            else fuelTick = 0.0002 + (v.consumption * 0.0001); // Movimiento
            
            // Estrés mecánico
            let currentStress = v.stressLevel;
            if (v.direction === 'TO_XELA' && newSpeed < 5 && newSpeed > 0) currentStress += 1; 
            
            if (v.mechanicalRisk > 0 && currentStress > 50) {
                if (Math.random() < (v.mechanicalRisk * 0.1)) {
                     setBreakdownAlert({ active: true, type: v.type });
                     return { ...v, currentSpeed: 0, status: 'BROKEN_DOWN', crashTime: Date.now() };
                }
            }

            const moveAmt = (newSpeed / 10) * 0.8 * timeMultiplier; 
            const newX = v.direction === 'TO_XELA' ? v.x + moveAmt : v.x - moveAmt;

            // --- ACCIDENTES ---
            let collisionDetected = false;
            let collisionType = 'NONE';
            const inBottleneckZone = activeScenario.mode === 'REVERSIBLE' && (newX > ROAD.BOTTLENECK_START && newX < ROAD.BOTTLENECK_END);

            if (isOvertakingNow || inBottleneckZone) {
                const hit = oppositeLane.find(opp => Math.abs(opp.x - newX) < (v.length * 0.7 + opp.length * 0.7) * 0.5);
                if (hit) { collisionDetected = true; collisionType = 'FRONTAL'; }
            }
            if (!isOvertakingNow && vehicleBehind && !forceStop) { 
                 let dist = v.direction === 'TO_XELA' ? (newX - vehicleBehind.x) : (vehicleBehind.x - newX);
                 if (dist < -3.0) { collisionDetected = true; collisionType = 'REAR'; }
            }

            if (collisionDetected) {
                const isVisible = newX > 0 && newX < ROAD.LENGTH;
                if (isVisible) {
                    let crashChance = ACCIDENT_RATES.BASE_CHANCE;
                    if (config.rainIntensity > 0) crashChance += (config.rainIntensity * ACCIDENT_RATES.RAIN_MULTIPLIER);
                    if (collisionType === 'FRONTAL') crashChance += 0.05; 
                    if (collisionType === 'REAR' && config.rainIntensity === 0) crashChance = 0;

                    if (Math.random() < crashChance) {
                        const accidentDetails = generateAccidentDetails(v.type);
                        const record = { id: Date.now(), type: v.type, time: new Date().toLocaleTimeString(), details: accidentDetails, collisionType };
                        setAccidentHistory(prev => [record, ...prev]);
                        setActiveAlert({ active: true, lastType: v.type });
                        return { ...v, x: newX, currentSpeed: 0, status: 'CRASHED', crashTime: Date.now() };
                    }
                }
                return { ...v, x: v.x, currentSpeed: 0, status: 'STOPPED' }; 
            }

            if (forceStop) return { ...v, currentSpeed: 0, status: 'STOPPED', stressLevel: currentStress, fuelConsumed: v.fuelConsumed + fuelTick };

            return { ...v, x: newX, currentSpeed: newSpeed, status: newSpeed < 1 ? 'STOPPED' : 'MOVING', isOvertaking: isOvertakingNow, stressLevel: currentStress, fuelConsumed: v.fuelConsumed + fuelTick };
        };

        const newXela = xelaLane.map((v, i) => updateVehicle(v, i, xelaLane));
        const newReu = reuLane.map((v, i) => updateVehicle(v, i, reuLane));
        return [...newXela, ...newReu].filter(v => {
            const outOfBounds = v.x < -200 || v.x > ROAD.LENGTH + 200;
            const isOldAccident = (v.status === 'CRASHED' && (Date.now() - v.crashTime > ROAD.ACCIDENT_DURATION));
            const isRepaired = (v.x === -9999);
            return !outOfBounds && !isOldAccident && !isRepaired;
        });
      });

      setStats(prev => {
        const stopped = vehicles.filter(v => v.status === 'STOPPED' || v.status === 'CRASHED' || v.status === 'BROKEN_DOWN').length;
        const moving = vehicles.length - stopped;
        
        let totalSpeed = 0;
        let totalWaitTime = 0;
        const fuelTick = (stopped * 0.5) + (moving * 0.1); 
        const cargoTick = stopped * 2.0; 

        if (vehicles.length > 0) {
            totalSpeed = vehicles.reduce((sum, v) => sum + v.currentSpeed, 0) / vehicles.length;
            totalWaitTime = vehicles.reduce((sum, v) => sum + (v.status === 'STOPPED' ? 1 : 0), 0) / vehicles.length * 10; 
        }

        return {
            totalCost: prev.totalCost + fuelTick + cargoTick,
            fuelCost: prev.fuelCost + fuelTick,
            cargoCost: prev.cargoCost + cargoTick,
            fuelConsumed: prev.fuelConsumed + (moving * 0.05) + (stopped * 0.02),
            stoppedVehicles: stopped,
            averageSpeed: Math.round(totalSpeed),
            avgWaitTime: Math.round(totalWaitTime)
        };
      });

    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, activeScenario, simTime, config, vehicles.length, trafficState.phase, resetSignal]); 

  return { vehicles, stats, trafficState, simTime, dayCount, accidentReport: activeAlert, breakdownAlert, accidentHistory };
};