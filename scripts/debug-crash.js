import { GameEngine } from '../src/engine/engine.js';
import { initialTeams } from '../src/data/teams.js';
import { players } from '../src/data/players.js';

async function test() {
    try {
        const engine = new GameEngine();
        engine.init(initialTeams, players, 1);
        const homeId = 1;
        const awayId = 2;
        
        console.log('Testing playMatchFirstHalf...');
        const result = engine.playMatchFirstHalf(homeId, awayId, false);
        console.log('Success!', result);
    } catch (e) {
        console.error('CRASH:', e.message);
        console.error(e.stack);
    }
}
test();
