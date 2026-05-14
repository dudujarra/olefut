// SPEC-180: Team database loader — migrated from hardcoded .js to JSON files.
// Backward-compatible: exports the same `RealDB` shape consumed by GameInitializer.
//
// Structure: { BRA: { 1: [...], 2: [...], ... }, ARG: { 1: [...], 2: [...] }, ... }
//
// Note: `with { type: 'json' }` is needed for Node.js >=18.
// Vite handles JSON imports natively regardless.

import BrazilData from '../../data/teams/brazil.json' with { type: 'json' };
import ArgentinaData from '../../data/teams/argentina.json' with { type: 'json' };
import UruguayData from '../../data/teams/uruguay.json' with { type: 'json' };
import ChileData from '../../data/teams/chile.json' with { type: 'json' };
import ColombiaData from '../../data/teams/colombia.json' with { type: 'json' };
import EnglandData from '../../data/teams/england.json' with { type: 'json' };
import SpainData from '../../data/teams/spain.json' with { type: 'json' };
import ItalyData from '../../data/teams/italy.json' with { type: 'json' };
import GermanyData from '../../data/teams/germany.json' with { type: 'json' };
import FranceData from '../../data/teams/france.json' with { type: 'json' };

export const RealDB = {
    BRA: BrazilData,
    // South America
    ARG: ArgentinaData,
    URU: UruguayData,
    CHI: ChileData,
    COL: ColombiaData,
    // Europe
    ENG: EnglandData,
    ESP: SpainData,
    ITA: ItalyData,
    GER: GermanyData,
    FRA: FranceData,
};
