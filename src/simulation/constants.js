// src/simulation/constants.js

export const SCENARIOS = {
    OPTIMISTA: { id: 'OPTIMISTA', factor: 1.0, name: "Escenario Ideal (Sin Socavón)", mode: 'DOUBLE_LANE', accidentProb: 0 },
    REAL: { id: 'REAL', factor: 1.5, name: "Escenario Real (Paso Regulado)", mode: 'REVERSIBLE', accidentProb: 0.001 },
    PESIMISTA: { id: 'PESIMISTA', factor: 2.0, name: "Escenario Caos (Lluvia/Accidentes)", mode: 'REVERSIBLE', accidentProb: 0.008 }
};

export const VEHICLE_TYPES = {
    MOTO: { id: 'moto', label: 'Moto', speed: 85, length: 3, color: 'text-purple-400', rank: 5, canOvertake: true, passengers: 2 },
    CAR: { id: 'car', label: 'Liviano', speed: 70, length: 5, color: 'text-blue-400', rank: 4, canOvertake: true, passengers: 5 },
    PICKUP: { id: 'pickup', label: 'Pick-up', speed: 65, length: 6, color: 'text-emerald-600', rank: 3, isCargo: true, canOvertake: false, passengers: 3 },
    BUS: { id: 'bus', label: 'Bus', speed: 55, length: 12, color: 'text-yellow-500', rank: 2, canOvertake: true, passengers: 50 }, // Buses llevan mucha gente y carga
    TRUCK: { id: 'truck', label: 'Camión', speed: 40, length: 14, color: 'text-orange-600', isCargo: true, rank: 1, canOvertake: false, passengers: 2 },
};

// maxLife: Tiempo en horas antes de perder calidad crítica (si es perecedero)
export const CARGO_TYPES = [
    { name: "Verduras (Almolonga)", value: 15000, perishable: true, maxLife: 6 }, 
    { name: "Material Construcción", value: 25000, perishable: false, maxLife: null },
    { name: "Combustible", value: 80000, perishable: false, maxLife: null },
    { name: "Paquetería", value: 40000, perishable: false, maxLife: null },
    { name: "Ganado", value: 60000, perishable: true, maxLife: 8 }, // Estrés animal
    { name: "Bebidas", value: 20000, perishable: false, maxLife: null },
    { name: "Mariscos (Costa)", value: 35000, perishable: true, maxLife: 4 } // Muy crítico
];

export const ROAD = {
    LENGTH: 1000,
    BOTTLENECK_START: 400,
    BOTTLENECK_END: 600,
    STOP_LINE_XELA: 350,   
    STOP_LINE_REU: 650,    
    SAFE_DISTANCE: 25,
    OVERTAKE_BUFFER: 25, 
    SIGHT_DISTANCE: 300, 
    ACCIDENT_DURATION: 15000,
    BREAKDOWN_DURATION: 20000
};

export const RUSH_HOURS = [
    { start: 7.5, end: 10.0, factor: 3.5 },
    { start: 13.0, end: 15.0, factor: 3.0 },
    { start: 18.0, end: 20.0, factor: 2.8 }
];

export const ACCIDENT_RATES = {
    BASE_CHANCE: 0.00006, 
    RAIN_MULTIPLIER: 0.000012, 
    OVERTAKE_RISK: 0.01 
};