// src/simulation/constants.js

export const SCENARIOS = {
    OPTIMISTA: { id: 'OPTIMISTA', factor: 1.0, name: "Escenario Ideal (Sin Socavón)", mode: 'DOUBLE_LANE', rainChance: 0 },
    REAL: { id: 'REAL', factor: 1.4, name: "Escenario Real (Paso Regulado)", mode: 'REVERSIBLE', rainChance: 0.3 },
    PESIMISTA: { id: 'PESIMISTA', factor: 1.8, name: "Escenario Caos (Colapso/Lluvia)", mode: 'REVERSIBLE', rainChance: 0.8 }
};

export const VEHICLE_TYPES = {
    MOTO: { id: 'moto', label: 'Moto', maxSpeed: 90, accel: 3, decel: 4, length: 2.5, color: 'text-purple-500', rank: 5, passengers: 2 },
    CAR: { id: 'car', label: 'Liviano', maxSpeed: 75, accel: 2, decel: 3, length: 4.5, color: 'text-blue-500', rank: 4, passengers: 4 },
    PICKUP: { id: 'pickup', label: 'Pick-up', maxSpeed: 65, accel: 1.8, decel: 2.5, length: 5.5, color: 'text-emerald-600', rank: 3, isCargo: true, passengers: 3 },
    BUS: { id: 'bus', label: 'Bus Extraurbano', maxSpeed: 55, accel: 1.2, decel: 2, length: 12, color: 'text-yellow-500', rank: 2, passengers: 45 },
    TRUCK: { id: 'truck', label: 'Transporte Pesado', maxSpeed: 40, accel: 0.8, decel: 1.5, length: 16, color: 'text-orange-600', isCargo: true, rank: 1, passengers: 2 },
};

export const CARGO_TYPES = [
    { name: "Verduras (Almolonga)", value: 18000, perishable: true, decayRate: 0.1 }, 
    { name: "Material Construcción", value: 35000, perishable: false, decayRate: 0 },
    { name: "Combustible", value: 95000, perishable: false, decayRate: 0 },
    { name: "Abarrotes/Varios", value: 45000, perishable: false, decayRate: 0 },
    { name: "Ganado", value: 75000, perishable: true, decayRate: 0.2 }, 
];

export const ROAD = {
    LENGTH: 1200, // Metros virtuales
    BOTTLENECK_START: 450,
    BOTTLENECK_END: 750,
    STOP_LINE_XELA: 400,   
    STOP_LINE_REU: 800,    
    SAFE_DISTANCE: 20, // Distancia deseada en metros
    TIME_HEADWAY: 1.5, // Segundos de distancia al coche de enfrente
    ACCIDENT_DURATION: 30000, // ms que dura un choque en pantalla
    BREAKDOWN_DURATION: 25000
};

// Costos en Quetzales
export const COSTS = {
    FUEL_IDLE_PER_HOUR: 25, // Q por hora en ralentí
    FUEL_MOVING_PER_KM: 4.5, // Q por km
    TIME_VALUE_PASSENGER: 35, // Q por hora por persona (productividad)
    OPPORTUNITY_COST_TRUCK: 200 // Q por hora detenido (camión)
};