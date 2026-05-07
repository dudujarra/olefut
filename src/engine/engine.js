import { Data } from './data';
import { RealDB } from './db/index';
import { League } from './tournaments/League';
import { ContinentalCup } from './tournaments/ContinentalCup';
import { KnockoutCup } from './tournaments/KnockoutCup';
import { ProPlayer } from './PlayerCareer';

export class Engine {
    constructor() {
        this.teams = [];
        this.tournaments = [];
        this.currentWeek = 0;
        this.mode = 'manager'; // 'manager' or 'player'
        this.proPlayer = null;
        this.manager = { name: '', teamId: null, money: 0, salary: 5000 };
        this.marketPlayers = [];
    }

    initGame(name, teamId, mode = 'manager', scenario = 'livre', playerPosition = 'ATA') {
        this.manager.name = name;
        this.manager.teamId = parseInt(teamId);
        this.mode = mode;

        // Create all teams from RealDB
        let idCounter = 1;
        for (const zone of Object.keys(RealDB)) {
            for (const divStr of Object.keys(RealDB[zone])) {
                const div = parseInt(divStr);
                RealDB[zone][div].forEach(club => {
                    const tier = zone === 'BRA' ? div : (zone === 'ARG' || zone === 'COL' ? 1.5 : 2);
                    const squad = Data.generateSquad(tier);
                    this.teams.push({
                        id: idCounter++,
                        name: club.name,
                        zone,
                        division: div,
                        squad,
                        formation: "4-3-3",
                        balance: club.budget,
                        stadium: club.stadium
                    });
                });
            }
        }

        // Apply scenario modifiers
        if (scenario === 'fallen') {
            const team = this.getTeam(this.manager.teamId);
            if (team) team.balance = Math.floor(team.balance * 0.1);
        }

        // Create leagues for each zone/division
        for (const zone of Object.keys(RealDB)) {
            for (const divStr of Object.keys(RealDB[zone])) {
                const div = parseInt(divStr);
                const leagueTeams = this.teams.filter(t => t.zone === zone && t.division === div).map(t => t.id);
                const league = new League(`${zone}_${div}`, `Liga ${zone} - Div ${div}`, div);
                league.init(leagueTeams);
                this.tournaments.push(league);
            }
        }

        // Create Copa do Brasil (knockout with all BRA teams)
        const braTeams = this.teams.filter(t => t.zone === 'BRA').map(t => t.id);
        const copaBrasil = new KnockoutCup('COPA_BR', 'Copa do Brasil', [4, 8, 12, 16, 20, 24, 28]);
        copaBrasil.init(braTeams);
        this.tournaments.push(copaBrasil);

        // Libertadores (top 4 BRA div1 + top 2 each SA country)
        const libTeams = [];
        libTeams.push(...this.teams.filter(t => t.zone === 'BRA' && t.division === 1).slice(0, 4).map(t => t.id));
        if (RealDB.ARG) libTeams.push(...this.teams.filter(t => t.zone === 'ARG' && t.division === 1).slice(0, 4).map(t => t.id));
        if (RealDB.URU) libTeams.push(...this.teams.filter(t => t.zone === 'URU' && t.division === 1).slice(0, 2).map(t => t.id));
        if (RealDB.CHI) libTeams.push(...this.teams.filter(t => t.zone === 'CHI' && t.division === 1).slice(0, 2).map(t => t.id));
        if (RealDB.COL) libTeams.push(...this.teams.filter(t => t.zone === 'COL' && t.division === 1).slice(0, 4).map(t => t.id));

        const libertadores = new ContinentalCup('LIBERTADORES', 'Copa Libertadores',
            [5, 9, 13], [17, 21, 25]);
        libertadores.init(libTeams);
        this.tournaments.push(libertadores);

        // Champions League (top 4 from each EU league)
        const clTeams = [];
        for (const z of ['ENG', 'ESP', 'ITA', 'GER', 'FRA']) {
            if (RealDB[z]) clTeams.push(...this.teams.filter(t => t.zone === z && t.division === 1).slice(0, 4).map(t => t.id));
        }
        const champions = new ContinentalCup('CHAMPIONS', 'Champions League',
            [6, 10, 14], [18, 22, 26]);
        champions.init(clTeams);
        this.tournaments.push(champions);

        // Generate market
        this.generateMarket();

        // Player mode setup
        if (mode === 'player') {
            const team = this.getTeam(this.manager.teamId);
            this.proPlayer = new ProPlayer(9999, name, playerPosition);
            // Inject into squad
            if (team) {
                const playerInSquad = {
                    id: 'pro_player',
                    name: name,
                    position: playerPosition,
                    attributes: { ...this.proPlayer.attributes },
                    ovr: 50,
                    age: 17,
                    energy: 100,
                    moral: 80,
                    salary: this.proPlayer.wage,
                    value: 1000000,
                    isTitular: true
                };
                team.squad.push(playerInSquad);
            }
        }
    }

    getTeam(id) {
        return this.teams.find(t => t.id === parseInt(id));
    }

    getTournament(id) {
        return this.tournaments.find(t => t.id === id);
    }

    getStandings(zone, div) {
        const league = this.getTournament(`${zone}_${div}`);
        return league ? league.standings : [];
    }

    getTeamSectors(teamId) {
        const team = this.getTeam(teamId);
        if (!team) return { attack: 0, midfield: 0, defense: 0, goalkeeper: 0 };
        const titulares = team.squad.filter(p => p.isTitular);
        const avg = (arr, attr) => arr.length === 0 ? 0 : Math.floor(arr.reduce((s, p) => s + (p.attributes[attr] || 50), 0) / arr.length);

        return {
            attack: avg(titulares.filter(p => p.position === 'ATA'), 'FIN'),
            midfield: avg(titulares.filter(p => p.position === 'MEI'), 'CRI'),
            defense: avg(titulares.filter(p => p.position === 'DEF'), 'DEF'),
            goalkeeper: avg(titulares.filter(p => p.position === 'GOL'), 'REF')
        };
    }

    generateMarket() {
        this.marketPlayers = [];
        for (let i = 0; i < 20; i++) {
            const positions = ['GOL', 'DEF', 'MEI', 'ATA'];
            const pos = positions[Math.floor(Math.random() * positions.length)];
            this.marketPlayers.push(Data.generatePlayer(pos, 2));
        }
    }

    playMatch(homeId, awayId, isCup = false) {
        const homeTeam = this.getTeam(homeId);
        const awayTeam = this.getTeam(awayId);

        const homeSectors = this.getTeamSectors(homeId);
        const awaySectors = this.getTeamSectors(awayId);

        let homeGoals = 0;
        let awayGoals = 0;
        const events = { home: [], away: [], textLog: [], playerChances: [] };

        for (let minute = 1; minute <= 90; minute++) {
            const isHomeAttacking = Math.random() > 0.45; // slight home advantage
            const attackingSectors = isHomeAttacking ? homeSectors : awaySectors;
            const defendingSectors = isHomeAttacking ? awaySectors : homeSectors;
            const attName = isHomeAttacking ? homeTeam.name : awayTeam.name;
            const defName = isHomeAttacking ? awayTeam.name : homeTeam.name;

            if (minute % 15 === 0) events.textLog.push({ minute, text: `${attName} roda a bola no meio-campo.` });

            const chanceRatio = attackingSectors.attack / (defendingSectors.defense || 1);
            if (Math.random() < (0.15 * chanceRatio)) {
                // Shot attempt
                const shotPower = attackingSectors.attack * Math.random();
                const saveChance = defendingSectors.goalkeeper * Math.random() * 0.6;

                if (shotPower > saveChance) {
                    // GOAL
                    if (isHomeAttacking) {
                        homeGoals++;
                        events.home.push({ minute, type: 'goal' });
                    } else {
                        awayGoals++;
                        events.away.push({ minute, type: 'goal' });
                    }
                    events.textLog.push({ minute, text: `⚽ GOOOL do ${attName}! (${homeGoals} x ${awayGoals})` });
                } else {
                    events.textLog.push({ minute, text: `Defesaça do goleiro do ${defName}!` });
                }
            }
        }

        if (isCup && homeGoals === awayGoals) {
            events.textLog.push({ minute: 90, text: `⚖️ Empate! Decisão nos Pênaltis!` });
            if (Math.random() > 0.5) {
                homeGoals++;
                events.textLog.push({ minute: 91, text: `🏆 ${homeTeam.name} VENCE nos pênaltis!` });
            } else {
                awayGoals++;
                events.textLog.push({ minute: 91, text: `🏆 ${awayTeam.name} VENCE nos pênaltis!` });
            }
        }

        return { homeGoals, awayGoals, events };
    }

    advanceWeek() {
        if (this.currentWeek >= 38) return null;

        const weekResults = {};

        this.tournaments.forEach(t => {
            const results = t.advanceWeek(this, this.currentWeek);
            if (results) weekResults[t.id] = results;
        });

        // Aplicar fadiga/recuperação no squad do Manager (Akita: lógica na Engine, não no React)
        if (this.mode === 'manager') {
            const team = this.getTeam(this.manager.teamId);
            if (team) {
                team.squad.forEach(p => {
                    if (p.isTitular) {
                        p.energy = Math.max(0, p.energy - (Math.floor(Math.random() * 10) + 15));
                    } else {
                        p.energy = Math.min(100, p.energy + 10);
                    }
                });
                // Bilheteria para jogos em casa
                for (const tId in weekResults) {
                    const myMatch = weekResults[tId].find(m => m.home === team.id);
                    if (myMatch) {
                        team.balance += (team.stadium * 20);
                        break;
                    }
                }
            }
        }

        // Pagar Salários
        if (this.mode === 'manager') this.manager.money += this.manager.salary;
        if (this.mode === 'player' && this.proPlayer) {
            this.proPlayer.receiveWage();

            // Check bench status
            this.proPlayer.checkBenchStatus();

            // Se o jogador não foi barrado, cobrar o preço do jogo
            if (!this.proPlayer.isBenched) {
                let matchWon = false;
                for (const tId in weekResults) {
                    const match = weekResults[tId].find(m => m.home === this.manager.teamId || m.away === this.manager.teamId);
                    if (match && match.score) {
                        if (match.home === this.manager.teamId && match.score.homeGoals > match.score.awayGoals) matchWon = true;
                        if (match.away === this.manager.teamId && match.score.awayGoals > match.score.homeGoals) matchWon = true;
                    }
                }

                const goalsScored = this.proPlayer.seasonGoals - (this.proPlayer.lastWeekGoals || 0);
                this.proPlayer.lastWeekGoals = this.proPlayer.seasonGoals;
                this.proPlayer.playMatch(90, goalsScored, matchWon);
            } else {
                this.proPlayer.playMatch(0, 0, false);
            }

            this.proPlayer.energy = Math.max(0, this.proPlayer.energy - this.proPlayer.energyDecayRate);

            // Sync attributes
            this.proPlayer.attributes.FIS = this.proPlayer.skills.pace;
            this.proPlayer.attributes.DEF = this.proPlayer.skills.power;
            this.proPlayer.attributes.CRI = this.proPlayer.skills.vision;
            this.proPlayer.attributes.FIN = this.proPlayer.skills.technique;

            // Reset weekly slots
            this.proPlayer.resetWeeklySlots();

            // Update renown
            this.proPlayer.renown += this.proPlayer.seasonGoals > 0 ? 1 : 0;
            this.proPlayer.updateStarRating();
        }

        this.currentWeek++;
        return weekResults;
    }

    registerPlayerGoal(type) {
        if (!this.proPlayer) return;
        this.proPlayer.seasonGoals++;
    }

    previewPlayerMatch() {
        if (this.mode !== 'player') return null;
        this.proPlayer.checkBenchStatus();
        return { isBenched: this.proPlayer.isBenched };
    }
}
