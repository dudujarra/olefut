const fs = require('fs');

const realPlayers = JSON.parse(fs.readFileSync('./src/data/realPlayers.json'));
const playersByTeam = {};
realPlayers.forEach(p => {
    playersByTeam[p.team] = (playersByTeam[p.team] || 0) + 1;
});

const dbFiles = ['./src/engine/db/brazil.js', './src/engine/db/europe.js', './src/engine/db/south_america.js'];
let dbTeams = [];

dbFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = [...content.matchAll(/name:\s*"([^"]+)"/g)];
    matches.forEach(m => dbTeams.push(m[1]));
});

let matches = 0;
let misses = [];

dbTeams.forEach(t => {
    if (playersByTeam[t]) {
        matches++;
    } else {
        misses.push(t);
    }
});

console.log(`Matched: ${matches}/${dbTeams.length}`);
console.log('Misses:');
misses.forEach(m => {
    const close = Object.keys(playersByTeam).filter(k => k.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(k.toLowerCase())).slice(0, 3);
    console.log(`- ${m} (Possible: ${close.join(', ')})`);
});
