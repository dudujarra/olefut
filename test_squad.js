import { Data } from './src/engine/data.js';

const squad = Data.generateSquad(1, 1000000000, "FC Barcelona");
console.log(`Squad size: ${squad.length}`);
console.log('Sample players:');
squad.slice(0, 5).forEach(p => console.log(`${p.name} (OVR: ${p.skill}, Pot: ${p.potential}, Age: ${p.age}) - Real? ${p.realData ? 'Yes' : 'No'}`));
