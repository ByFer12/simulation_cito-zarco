// src/simulation/engine.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { VEHICLE_TYPES, ROAD, RUSH_HOURS, ACCIDENT_RATES } from './constants';

export const useSimulationEngine = (activeScenario, isRunning, config, resetSignal) => {
  const [vehicles, setVehicles] = useState([]);
  const [accidentReport, setAccidentReport] = useState(null);
  
  // ESTADO DEL TIEMPO
  const [simTime, setSimTime] = useState(null);
  const [dayCount, setDayCount] = useState(1);

  const [trafficState, setTrafficState] = useState({
    lightXela: 'GREEN', 
    lightReu: 'GREEN', 
    phase: 'OPEN', 
    timeRemaining: 0
  });

  const [stats, setStats] = useState({ totalCost: 0, fuelConsumed: 0, stoppedVehicles: 0 });
  
  const phaseTimer = useRef(0);
  const currentPhase = useRef('OPEN');
  const lastHourRef = useRef(-1); 
  const clockTickRef = useRef(0); 

  // --- REINICIO (RESET) ---
  useEffect(() => {
    setVehicles([]);
    setStats({ totalCost: 0, fuelConsumed: 0, stoppedVehicles: 0 });
    setAccidentReport(null);
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

  // --- LIMPIEZA AUTOMÁTICA DE MENSAJE ---
  useEffect(() => {
    if (accidentReport?.active) {
        const timer = setTimeout(() => {
            setAccidentReport(prev => prev ? { ...prev, active: false } : null);
        }, 5000); 
        return () => clearTimeout(timer);
    }
  }, [accidentReport?.active]);

  // CALCULAR DENSIDAD
  const getTrafficDensity = useCallback((dateObj) => {
      if (!dateObj) return 1;
      const currentHour = dateObj.getHours() + (dateObj.getMinutes() / 60);
      const rush = RUSH_HOURS.find(r => currentHour >= r.start && currentHour <= r.end);
      let density = rush ? rush.factor : 1.0;
      if (currentHour > 22 || currentHour < 5) density = 0.2; 
      if (config.rainIntensity > 6) density *= 0.6; 
      return density;
  }, [config.rainIntensity]);

  // SPAWN VEHICLE
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
      ...vConfig
    };
  }, [config.rainIntensity]);

  useEffect(() => {
    if (!isRunning || !simTime) return;

    const interval = setInterval(() => {
      
      // --- 1. RELOJ ---
      clockTickRef.current += 1;
      if (clockTickRef.current >= 4) { 
          clockTickRef.current = 0;
          setSimTime(prev => {
              if (!prev) return new Date();
              const newTime = new Date(prev.getTime() + 60000); 
              const newHour = newTime.getHours();
              if (lastHourRef.current === 23 && newHour === 0) {
                  setDayCount(d => d + 1);
              }
              lastHourRef.current = newHour;
              return newTime;
          });
      }

      // --- 2. SEMÁFOROS ---
      if (activeScenario.id === 'OPTIMISTA') {
          setTrafficState({ lightXela: 'GREEN', lightReu: 'GREEN', phase: 'OPEN' });
      } else {
        const GREEN_TIME = parseInt(config.greenDuration) || 400;
        if (currentPhase.current === 'OPEN') { currentPhase.current = 'FLOW_XELA'; phaseTimer.current = GREEN_TIME; }

        switch (currentPhase.current) {
            case 'FLOW_XELA':
                phaseTimer.current--;
                setTrafficState({ lightXela: 'GREEN', lightReu: 'RED', phase: 'PASO A XELA' });
                if (phaseTimer.current <= 0) currentPhase.current = 'CLEARING_FROM_XELA';
                break;
            case 'CLEARING_FROM_XELA':
                setTrafficState({ lightXela: 'RED', lightReu: 'RED', phase: 'DESPEJE' });
                const vehInDangerXela = vehicles.some(v => v.direction === 'TO_XELA' && v.x > ROAD.STOP_LINE_XELA && v.x < (ROAD.BOTTLENECK_END + 50));
                if (!vehInDangerXela) { currentPhase.current = 'FLOW_REU'; phaseTimer.current = GREEN_TIME; }
                break;
            case 'FLOW_REU':
                phaseTimer.current--;
                setTrafficState({ lightXela: 'RED', lightReu: 'GREEN', phase: 'PASO A REU' });
                if (phaseTimer.current <= 0) currentPhase.current = 'CLEARING_FROM_REU';
                break;
            case 'CLEARING_FROM_REU':
                setTrafficState({ lightXela: 'RED', lightReu: 'RED', phase: 'DESPEJE' });
                const vehInDangerReu = vehicles.some(v => v.direction === 'TO_REU' && v.x < ROAD.STOP_LINE_REU && v.x > (ROAD.BOTTLENECK_START - 50));
                if (!vehInDangerReu) { currentPhase.current = 'FLOW_XELA'; phaseTimer.current = GREEN_TIME; }
                break;
            default: break;
        }
      }

      // --- 3. GENERACIÓN ---
      const density = getTrafficDensity(simTime);
      const baseSpawnRate = 0.03 * activeScenario.factor * density;
      
      if (Math.random() < baseSpawnRate) {
        setVehicles(prev => {
             const blocked = prev.some(v => v.direction === 'TO_XELA' && v.x < 10);
             return blocked ? prev : [...prev, spawnVehicle('TO_XELA')];
        });
      }
      if (Math.random() < baseSpawnRate) {
        setVehicles(prev => {
             const blocked = prev.some(v => v.direction === 'TO_REU' && v.x > ROAD.LENGTH - 10);
             return blocked ? prev : [...prev, spawnVehicle('TO_REU')];
        });
      }

      // --- 4. FÍSICA Y COLISIONES ---
      setVehicles(prev => {
        const xelaLane = prev.filter(v => v.direction === 'TO_XELA').sort((a, b) => a.x - b.x);
        const reuLane = prev.filter(v => v.direction === 'TO_REU').sort((a, b) => b.x - a.x);

        const updateVehicle = (v, index, laneArray) => {
            if (v.status === 'CRASHED') return v; 

            let targetSpeed = v.maxSpeed;

            // Semáforos
            if (activeScenario.id !== 'OPTIMISTA') {
                if (v.direction === 'TO_XELA' && trafficState.lightXela === 'RED') {
                    if (v.x < ROAD.STOP_LINE_XELA && (ROAD.STOP_LINE_XELA - v.x) < 150) {
                         const dist = ROAD.STOP_LINE_XELA - v.x;
                         targetSpeed = dist < 5 ? 0 : Math.min(targetSpeed, dist * 0.8);
                    }
                }
                if (v.direction === 'TO_REU' && trafficState.lightReu === 'RED') {
                    if (v.x > ROAD.STOP_LINE_REU && (v.x - ROAD.STOP_LINE_REU) < 150) {
                        const dist = v.x - ROAD.STOP_LINE_REU;
                        targetSpeed = dist < 5 ? 0 : Math.min(targetSpeed, dist * 0.8);
                    }
                }
            }

            const vehicleAhead = laneArray[index + 1]; 
            const vehicleBehind = laneArray[index - 1]; 
            const oppositeLane = v.direction === 'TO_XELA' ? reuLane : xelaLane;

            let isOvertakingNow = v.isOvertaking; 
            let forceStop = false; 

            // -- LÓGICA DE VELOCIDAD Y INICIO DE REBASE --
            if (vehicleAhead) {
                let gap = 0;
                if (v.direction === 'TO_XELA') gap = (vehicleAhead.x - vehicleAhead.length) - v.x;
                else gap = v.x - (vehicleAhead.x + vehicleAhead.length);

                const requiredSafeDistance = ROAD.SAFE_DISTANCE + (v.currentSpeed * 0.5);
                const inDangerZone = activeScenario.id !== 'OPTIMISTA' && (v.x > ROAD.BOTTLENECK_START - 100 && v.x < ROAD.BOTTLENECK_END + 100);
                const rainCaution = config.rainIntensity > 5; 
                
                // *** VERIFICACIÓN DE SEGURIDAD EN CARRIL CONTRARIO ***
                let isOppositeClear = true;
                // Si quiero rebasar, miro si viene alguien de frente en X metros
                if (!isOvertakingNow) {
                    const oncoming = oppositeLane.find(opp => {
                        // Si voy a Xela (x crece), me preocupan los que vienen de Reu (x decrece) con x > mi x
                        if (v.direction === 'TO_XELA') {
                            return opp.x > v.x && opp.x < (v.x + ROAD.SIGHT_DISTANCE);
                        } else {
                            // Si voy a Reu (x decrece), me preocupan los que vienen de Xela con x < mi x
                            return opp.x < v.x && opp.x > (v.x - ROAD.SIGHT_DISTANCE);
                        }
                    });
                    if (oncoming) isOppositeClear = false;
                }

                // CONDICIONES PARA INICIAR REBASE
                const shouldStartOvertake = config.allowOvertaking 
                                    && !v.isOvertaking
                                    && !inDangerZone 
                                    && !rainCaution
                                    && v.rank > vehicleAhead.rank
                                    && vehicleAhead.currentSpeed > 15
                                    && isOppositeClear; // <--- NUEVA CONDICIÓN CRÍTICA

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
                        // Si ya estoy rebasando, sigo acelerando
                        targetSpeed = v.maxSpeed * 1.1; 
                    } else {
                        targetSpeed = Math.min(targetSpeed, vehicleAhead.currentSpeed);
                    }
                } else if (gap < requiredSafeDistance * 2) {
                    if (!v.isOvertaking) targetSpeed = Math.min(targetSpeed, v.maxSpeed * 0.8);
                }
            }

            // -- LÓGICA DE RETORNO (EL PROBLEMA DE LA COLA) --
            if (isOvertakingNow) {
                // Verificar carril original para volver
                let potentialBehind, potentialAhead;

                if (v.direction === 'TO_XELA') {
                    potentialBehind = laneArray.filter(c => c.uid !== v.uid && c.x < v.x).pop(); 
                    potentialAhead = laneArray.find(c => c.uid !== v.uid && c.x > v.x); 
                } else {
                    potentialBehind = laneArray.filter(c => c.uid !== v.uid && c.x > v.x).pop(); 
                    potentialAhead = laneArray.find(c => c.uid !== v.uid && c.x < v.x); 
                }

                let gapBack = 999;
                let gapFront = 999;

                if (potentialBehind) {
                    gapBack = Math.abs(v.x - potentialBehind.x) - (v.length/2 + potentialBehind.length/2);
                }
                if (potentialAhead) {
                    gapFront = Math.abs(potentialAhead.x - v.x) - (v.length/2 + potentialAhead.length/2);
                }

                const canReturn = gapBack > ROAD.OVERTAKE_BUFFER && gapFront > ROAD.OVERTAKE_BUFFER;

                if (canReturn) {
                    isOvertakingNow = false; 
                } else {
                    isOvertakingNow = true;
                }
            }

            // Inercia
            let newSpeed = v.currentSpeed;
            if (targetSpeed > v.currentSpeed) newSpeed += 2; 
            else if (targetSpeed < v.currentSpeed) newSpeed -= 4;
            if (newSpeed < 0) newSpeed = 0;

            const moveAmt = (newSpeed / 10) * 0.8; 
            const newX = v.direction === 'TO_XELA' ? v.x + moveAmt : v.x - moveAmt;

            // --- SISTEMA DE ACCIDENTES (CORREGIDO) ---
            let collisionDetected = false;
            let collisionType = 'NONE';
            
            const inBottleneckZone = activeScenario.mode === 'REVERSIBLE' && 
                                     (newX > ROAD.BOTTLENECK_START && newX < ROAD.BOTTLENECK_END);

            // 1. Choque Frontal (Solo si invade carril O está en el socavón)
            if (isOvertakingNow || inBottleneckZone) {
                const hit = oppositeLane.find(opp => Math.abs(opp.x - newX) < (v.length * 0.7 + opp.length * 0.7) * 0.5);
                if (hit) {
                    collisionDetected = true;
                    collisionType = 'FRONTAL';
                }
            }

            // 2. Choque Trasero (SOLO si no estoy rebasando y el solapamiento es brutal)
            if (!isOvertakingNow && vehicleBehind && !forceStop) { 
                 let dist = v.direction === 'TO_XELA' ? (newX - vehicleBehind.x) : (vehicleBehind.x - newX);
                 if (dist < -3.0) {
                     collisionDetected = true;
                     collisionType = 'REAR';
                 }
            }

            if (collisionDetected) {
                let crashChance = ACCIDENT_RATES.BASE_CHANCE;
                if (config.rainIntensity > 0) crashChance += (config.rainIntensity * ACCIDENT_RATES.RAIN_MULTIPLIER);
                if (collisionType === 'FRONTAL') crashChance += 0.05; 
                if (collisionType === 'REAR' && config.rainIntensity === 0) crashChance = 0;

                if (Math.random() < crashChance) {
                    setAccidentReport(prev => {
                       if (!prev || !prev.active) {
                           return {
                               active: true,
                               count: (prev?.count || 0) + 1,
                               lastType: v.type,
                               time: new Date().toLocaleTimeString()
                           };
                       }
                       return prev;
                    });
                    
                    return { ...v, x: newX, currentSpeed: 0, status: 'CRASHED', crashTime: Date.now() };
                } else {
                    return { ...v, x: v.x, currentSpeed: 0, status: 'STOPPED' }; 
                }
            }

            if (forceStop) return { ...v, currentSpeed: 0, status: 'STOPPED' };

            return {
                ...v,
                x: newX,
                currentSpeed: newSpeed,
                status: newSpeed < 1 ? 'STOPPED' : 'MOVING',
                isOvertaking: isOvertakingNow 
            };
        };

        const newXela = xelaLane.map((v, i) => updateVehicle(v, i, xelaLane));
        const newReu = reuLane.map((v, i) => updateVehicle(v, i, reuLane));
        const allVehicles = [...newXela, ...newReu];

        return allVehicles.filter(v => {
            const outOfBounds = v.x < -200 || v.x > ROAD.LENGTH + 200;
            const isOldAccident = v.status === 'CRASHED' && (Date.now() - v.crashTime > ROAD.ACCIDENT_DURATION);
            return !outOfBounds && !isOldAccident;
        });
      });

      setStats(prev => {
        const stopped = vehicles.filter(v => v.status === 'STOPPED' || v.status === 'CRASHED').length;
        const moving = vehicles.length - stopped;
        return {
            totalCost: prev.totalCost + (stopped * 0.9) + (moving * 0.1),
            fuelConsumed: prev.fuelConsumed + (moving * 0.05) + (stopped * 0.02),
            stoppedVehicles: stopped
        };
      });

    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, activeScenario, simTime, config, vehicles.length, trafficState.phase, resetSignal]); 

  return { vehicles, stats, trafficState, simTime, dayCount, accidentReport };
};