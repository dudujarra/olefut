import { Engine } from './engine.js';
import { MatchSimulator } from '../services/MatchSimulator.js';
import { LLMNarrativeService } from '../services/LLMNarrativeService.js';
import { MythService } from '../services/MythService.js';
import { RelationshipService } from '../services/RelationshipService.js';
import { NarrativeService } from '../services/NarrativeService.js';
import { CareerService } from '../services/CareerService.js';
import { InheritanceService } from '../services/InheritanceService.js';
import { WeekProcessor } from '../services/WeekProcessor.js';
import { SeasonProcessor } from '../services/SeasonProcessor.js';
import { NpcWeekProcessor } from '../services/NpcWeekProcessor.js';
import { TransferService } from '../services/TransferService.js';
import { ScoutingService } from '../services/ScoutingService.js';
import { LoanService } from '../services/LoanService.js';
import { FacilityService } from '../services/FacilityService.js';
import { FormationService } from '../services/FormationService.js';
import { PressService } from '../services/PressService.js';
import { SectorService } from '../services/SectorService.js';
import { GameInitializer } from '../services/GameInitializer.js';

/**
 * @module engineFactory
 * Solves the God Object Circular Dependency by decoupling Engine from Services.
 */
export function createEngine() {
    const engine = new Engine();

    // Instantiate and inject services
    engine._matchSimulator = new MatchSimulator();
    engine.llmNarrative = new LLMNarrativeService();
    engine._weekProcessor = new WeekProcessor();
    engine._seasonProcessor = new SeasonProcessor();
    engine._npcWeekProcessor = new NpcWeekProcessor();
    engine._transferService = new TransferService();
    engine._scoutingService = new ScoutingService();
    engine._loanService = new LoanService();
    engine._facilityService = new FacilityService();
    engine._formationService = new FormationService();
    engine._pressService = new PressService();
    engine._sectorService = new SectorService();
    engine._gameInitializer = new GameInitializer();
    engine._mythService = new MythService();
    engine._relationshipService = new RelationshipService();
    engine._narrativeService = new NarrativeService({
        relationshipService: engine._relationshipService,
        mythService: engine._mythService
    });
    engine._careerService = new CareerService({
        mythService: engine._mythService,
        relationshipService: engine._relationshipService,
        narrativeService: engine._narrativeService
    });
    engine._inheritanceService = new InheritanceService({
        mythService: engine._mythService
    });

    return engine;
}
