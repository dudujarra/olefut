/**
 * slangs.js — SPEC-077 Brazilian Slangs Regional + Contextual
 *
 * 5 regions × ~10 slangs each = 50+ catalog
 * Plus 15 player type stereotypes
 */

export const SLANGS_BY_REGION = {
    paulista: [
        { word: 'Bola na rede', context: 'goal', region: 'SP' },
        { word: 'Toma!', context: 'goalCelebration', region: 'SP' },
        { word: 'Tirar onda', context: 'mocking', region: 'SP' },
        { word: 'Jogada manjada', context: 'predictable', region: 'SP' },
        { word: 'Tá fácil', context: 'easy', region: 'SP' },
        { word: 'Pelado', context: 'noContext', region: 'SP' },
        { word: 'Mano', context: 'address', region: 'SP' },
        { word: 'Sussa', context: 'easy', region: 'SP' },
        { word: 'Daora', context: 'cool', region: 'SP' }
    ],
    carioca: [
        { word: 'Que isso, irmão!', context: 'surprise', region: 'RJ' },
        { word: 'Maracanazinho', context: 'stadium', region: 'RJ' },
        { word: 'Tá ligado?', context: 'address', region: 'RJ' },
        { word: 'Mermão', context: 'address', region: 'RJ' },
        { word: 'Caraca', context: 'surprise', region: 'RJ' },
        { word: 'Bicho', context: 'address', region: 'RJ' },
        { word: 'Sangue bom', context: 'praise', region: 'RJ' },
        { word: 'Trampo', context: 'work', region: 'RJ' },
        { word: 'Suave', context: 'easy', region: 'RJ' }
    ],
    gaucho: [
        { word: 'Tchê', context: 'address', region: 'RS' },
        { word: 'Bah', context: 'expression', region: 'RS' },
        { word: 'Capaz', context: 'irony', region: 'RS' },
        { word: 'Que bagual', context: 'tough', region: 'RS' },
        { word: 'Tri legal', context: 'cool', region: 'RS' },
        { word: 'Vivente', context: 'address', region: 'RS' },
        { word: 'Guri', context: 'youngPlayer', region: 'RS' },
        { word: 'Negúcio', context: 'thing', region: 'RS' }
    ],
    nordestino: [
        { word: 'Vixe!', context: 'surprise', region: 'NE' },
        { word: 'Mainha', context: 'address', region: 'NE' },
        { word: 'Painho', context: 'address', region: 'NE' },
        { word: 'Arrochar', context: 'force', region: 'NE' },
        { word: 'Oxe!', context: 'surprise', region: 'NE' },
        { word: 'Lascar', context: 'breakDown', region: 'NE' },
        { word: 'Massa', context: 'cool', region: 'NE' },
        { word: 'Brodi', context: 'friend', region: 'NE' }
    ],
    mineiro: [
        { word: 'Sô', context: 'address', region: 'MG' },
        { word: 'Trem', context: 'thing', region: 'MG' },
        { word: 'Uai', context: 'expression', region: 'MG' },
        { word: 'Cuidado, sô', context: 'warning', region: 'MG' },
        { word: 'Demais', context: 'praise', region: 'MG' },
        { word: 'Ô bão', context: 'praise', region: 'MG' },
        { word: 'Dô conta', context: 'capable', region: 'MG' }
    ]
};

// Player type stereotypes BR (15 from research catalog)
export const PLAYER_TYPES_BR = {
    pe_quente: { name: 'Pé Quente', desc: 'Acerta gols decisivos', buff: { goalsClutch: 0.20 } },
    camisa_10: { name: 'Camisa 10', desc: 'Líder, criativo', buff: { teamMoral: 5, vision: 10 } },
    carrasco: { name: 'Carrasco', desc: 'Faz gol contra rival', buff: { vsRival: 0.30 } },
    cria_da_base: { name: 'Cria da Base', desc: 'Loyalty alta sub-9', buff: { loyalty: 50 } },
    maestro: { name: 'Maestro', desc: 'Toca, distribui', buff: { passing: 15, vision: 10 } },
    pipoqueiro: { name: 'Pipoqueiro', desc: 'Falha em jogos importantes', buff: { vsBigMatch: -0.20 } },
    beque_fazenda: { name: 'Beque de Fazenda', desc: 'Defensor brutal sem técnica', buff: { strength: 20, technique: -10 } },
    caneleiro: { name: 'Caneleiro', desc: 'Joga rough', buff: { intimidation: 15, cards: 0.30 } },
    cordeirinho: { name: 'Cordeirinho', desc: 'Gentil sem garra', buff: { intimidation: -10, cards: -0.50 } },
    cavalo_paraguaio: { name: 'Cavalo Paraguaio', desc: 'Começa bem, cai prod', buff: { formCurve: 'descending' } },
    talisma: { name: 'Talismã', desc: 'Sorte do clube', buff: { teamLuck: 5 } },
    acougueiro: { name: 'Açougueiro', desc: 'Faltas constantes', buff: { fouls: 0.40 } },
    pe_de_pato: { name: 'Pé-de-Pato', desc: 'Atira longe potente', buff: { longShot: 25 } },
    sanguinario: { name: 'Sanguinário', desc: 'Ódio rival visível', buff: { vsRival: 0.20 } },
    showman: { name: 'Showman', desc: 'Joga pra plateia', buff: { fans: 5, boss: -3 } }
};

export function pickRegionalSlang(context, region = 'paulista') {
    const slangs = SLANGS_BY_REGION[region] || SLANGS_BY_REGION.paulista;
    const matching = slangs.filter(s => s.context === context);
    if (matching.length === 0) return null;
    return matching[Math.floor(Math.random() * matching.length)].word;
}
