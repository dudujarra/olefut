import { AutoPlayService } from './src/services/AutoPlayService.js';
import { GameInitializer } from './src/services/GameInitializer.js';
const engine = GameInitializer.initNewGame(null);
const bot = new AutoPlayService(engine, 'fallen', 'sinistro');
bot.advanceMultiWeek(1, console, () => {}).catch(e => console.error("CRASH", e));
