// src/simulation/constants.js

export const SCENARIOS = {
    OPTIMISTA: { id: 'OPTIMISTA', factor: 1.0, name: "Escenario Ideal (Sin Socavón)", mode: 'DOUBLE_LANE', accidentProb: 0 },
    REAL: { id: 'REAL', factor: 1.5, name: "Escenario Real (Paso Regulado)", mode: 'REVERSIBLE', accidentProb: 0.001 },
    PESIMISTA: { id: 'PESIMISTA', factor: 2.0, name: "Escenario Caos (Lluvia/Accidentes)", mode: 'REVERSIBLE', accidentProb: 0.008 }
};

export const VEHICLE_TYPES = {
    MOTO: { id: 'moto', label: 'Moto', speed: 85, consumption: 0.02, costPerHour: 20, length: 3, color: 'text-purple-400', rank: 5 },
    CAR: { id: 'car', label: 'Liviano', speed: 70, consumption: 0.05, costPerHour: 51, length: 5, color: 'text-blue-400', rank: 4 },
    PICKUP: { id: 'pickup', label: 'Pick-up', speed: 65, consumption: 0.1, costPerHour: 80, length: 6, color: 'text-emerald-600', rank: 3, isCargo: true },
    BUS: { id: 'bus', label: 'Bus', speed: 55, consumption: 0.3, costPerHour: 100, length: 12, color: 'text-yellow-500', rank: 2 },
    TRUCK: { id: 'truck', label: 'Camión', speed: 40, consumption: 0.5, costPerHour: 150, length: 14, color: 'text-orange-600', isCargo: true, rank: 1 },
};

export const ROAD = {
    LENGTH: 1000,
    BOTTLENECK_START: 400,
    BOTTLENECK_END: 600,
    STOP_LINE_XELA: 350,   
    STOP_LINE_REU: 650,    
    SAFE_DISTANCE: 25,
    OVERTAKE_BUFFER: 20, 
    SIGHT_DISTANCE: 250, // Distancia que mira el conductor antes de rebasar
    ACCIDENT_DURATION: 15000 
};

export const RUSH_HOURS = [
    { start: 7.5, end: 10.0, factor: 2.5 },  
    { start: 12.0, end: 15.5, factor: 3.0 }, 
    { start: 17.5, end: 19.5, factor: 2.2 }  
];

// Probabilidades reducidas aún más debido a la nueva seguridad
export const ACCIDENT_RATES = {
    BASE_CHANCE: 0.000000005, 
    RAIN_MULTIPLIER: 0.00000005, 
    OVERTAKE_RISK: 0.001 
};