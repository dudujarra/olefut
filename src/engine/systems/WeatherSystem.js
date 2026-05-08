// SPEC-024: Climate & Weather System
// 14 tipos weather. Afeta possession, passing, lesão, cards.

export const WEATHER_TYPES = {
    Ensolarado: { temp: [25, 32], visibility: 'Excelente', injuryRisk: 0, possession: 0, passing: 95, cardRisk: 0 },
    Nublado: { temp: [15, 25], visibility: 'Boa', injuryRisk: 5, possession: 0, passing: 93, cardRisk: 0 },
    'Chuva leve': { temp: [12, 18], visibility: 'Boa', injuryRisk: 10, possession: -10, passing: 85, cardRisk: 5 },
    'Chuva forte': { temp: [8, 15], visibility: 'Ruim', injuryRisk: 25, possession: -20, passing: 75, cardRisk: 10 },
    Neblina: { temp: [5, 12], visibility: 'Péssima', injuryRisk: 15, possession: -15, passing: 80, cardRisk: 5 },
    Granizo: { temp: [0, 8], visibility: 'Péssima', injuryRisk: 30, possession: -25, passing: 70, cardRisk: 12 },
    'Vento forte': { temp: [10, 20], visibility: 'Boa', injuryRisk: 10, possession: -5, passing: 90, cardRisk: 5 },
    Tempestade: { temp: [0, 5], visibility: 'Péssima', injuryRisk: 40, possession: -30, passing: 60, cardRisk: 15 },
    Neve: { temp: [-5, 0], visibility: 'Péssima', injuryRisk: 35, possession: -25, passing: 65, cardRisk: 12 },
    Geada: { temp: [-10, 5], visibility: 'Ruim', injuryRisk: 20, possession: -10, passing: 80, cardRisk: 8 },
    'Calor extremo': { temp: [35, 42], visibility: 'Excelente', injuryRisk: 50, possession: -5, passing: 92, cardRisk: 15 },
    'Frio extremo': { temp: [-15, -10], visibility: 'Péssima', injuryRisk: 45, possession: -20, passing: 70, cardRisk: 12 },
    'Altitude alta': { temp: [10, 20], visibility: 'Boa', injuryRisk: 5, possession: -15, passing: 88, cardRisk: 0, fatigueMul: 1.1 },
    'Ar seco': { temp: [20, 28], visibility: 'Excelente', injuryRisk: 8, possession: 0, passing: 94, cardRisk: 0 },
};

export const TACTIC_BONUSES = {
    'Chuva forte': { Defensivo: 10, Controlador: 0, Agressivo: -5 },
    Tempestade: { Defensivo: 15, Controlador: -5, Agressivo: -10 },
    'Calor extremo': { Defensivo: 5, Controlador: 5, Agressivo: -10 },
};

export const REGION_BIAS = {
    Brasil: ['Ensolarado', 'Chuva leve', 'Calor extremo', 'Nublado'],
    Europa: ['Nublado', 'Vento forte', 'Neve', 'Chuva leve', 'Geada'],
    'Ásia': ['Chuva forte', 'Calor extremo', 'Altitude alta', 'Nublado'],
    'África': ['Calor extremo', 'Ar seco', 'Ensolarado'],
    Argentina: ['Vento forte', 'Ensolarado', 'Nublado'],
};

// BUG-013 fix: rngState removed module-level (shared race). Per-instance encapsulation.
function makeRng(seed) {
    let state = seed;
    return function () {
        let t = (state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export class WeatherSystem {
    constructor(seed = 42) {
        this.weeklyWeather = new Map();
        this.rng = makeRng(seed);
    }

    setSeed(seed) {
        this.rng = makeRng(seed);
    }

    setWeather({ weekOfYear, type, region }) {
        if (!WEATHER_TYPES[type]) return null;
        const data = WEATHER_TYPES[type];
        const [tMin, tMax] = data.temp;
        const temp = tMin + this.rng() * (tMax - tMin);
        const w = { type, temp, region, week: weekOfYear, ...data };
        this.weeklyWeather.set(weekOfYear, w);
        return w;
    }

    generateWeather(weekOfYear, region = 'Brasil') {
        const types = REGION_BIAS[region] || REGION_BIAS.Brasil;
        const idx = Math.floor(this.rng() * types.length);
        return this.setWeather({ weekOfYear, type: types[idx], region });
    }

    getWeather(weekOfYear) {
        return this.weeklyWeather.get(weekOfYear) || null;
    }

    getWeatherImpact(weekOfYear) {
        const w = this.weeklyWeather.get(weekOfYear);
        if (!w) {
            return {
                possession: 0,
                passing: 95,
                injuryRisk: 0,
                cardRisk: 0,
                tacticBonus: { Defensivo: 0, Controlador: 0, Agressivo: 0 },
                fatigueMultiplier: 1.0,
            };
        }
        return {
            possession: w.possession,
            passing: w.passing,
            injuryRisk: w.injuryRisk,
            cardRisk: w.cardRisk,
            tacticBonus: TACTIC_BONUSES[w.type] || { Defensivo: 0, Controlador: 0, Agressivo: 0 },
            fatigueMultiplier: w.fatigueMul || 1.0,
        };
    }
}
