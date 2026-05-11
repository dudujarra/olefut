/* eslint-disable no-unused-vars */
/**
 * PlayerDevelopment.js — Aging, Form, Development, Retirement
 * 
 * §3 do Game Design Document — Player Development Science:
 * - Crescimento: CA → PA asymptotic (últimos 5% são os mais difíceis)
 * - Curvas de idade DIFERENTES por posição (§3.1)
 * - Physical stats declinam rápido; mental stats podem SUBIR após 30
 * - Individual variance (σ = 1-3 anos around peak)
 * - Aposentadoria: 35-40 com chance crescente (goleiros até 38)
 * - Form: hot/cold streaks baseado em performance
 */

import { rng } from './rng';
import { calcMarketValue } from './MarketPricer.js';

/**
 * SCHEMA-UNIFIED: Guard — garante que player tem os 5 atributos root-level.
 * Migrado de player.attributes.{FIS,DEF,CRI,FIN,REF} para player.{attacking,technical,tactical,defending,creativity}
 * para alinhar com data.js generatePlayer() que espalha stats no root do player object.
 *
 * BUG-096 fix: antes criava player.attributes fantasma com tudo em 50, causando
 * convergência de OVR para 50 ao longo das semanas. Agora opera diretamente nas
 * chaves reais que data.js gera.
 */
const STAT_KEYS = ['attacking', 'technical', 'tactical', 'defending', 'creativity'];

export function ensureAttributes(player) {
    if (!player) return player;
    for (const attr of STAT_KEYS) {
        if (player[attr] === undefined || player[attr] === null || isNaN(player[attr])) {
            player[attr] = player.ovr || 50; // fallback inteligente: usa o OVR como base
        }
    }
    // Backward compat: se existir player.attributes do schema antigo, migrar e limpar
    if (player.attributes && typeof player.attributes === 'object') {
        const old = player.attributes;
        const mapping = { FIN: 'attacking', CRI: 'creativity', DEF: 'defending', FIS: 'technical', REF: 'tactical' };
        for (const [oldKey, newKey] of Object.entries(mapping)) {
            if (old[oldKey] !== undefined && (player[newKey] === undefined || player[newKey] === (player.ovr || 50))) {
                player[newKey] = old[oldKey];
            }
        }
        delete player.attributes; // limpar schema antigo
    }
    return player;
}

const PERSONALITY_GROWTH = {
    "Profissional": 1.3,     // treina mais, cresce mais
    "Ambicioso": 1.2,        // quer jogar, cresce se titular
    "Determinado": 1.15,     // constante
    "Casual": 0.9,           // não se esforça tanto
    "Preguiçoso": 0.7,       // mínimo esforço
    "Líder Nato": 1.25,      // MEGA PATCH: inspira e cresce junto
    "Rebelde": 1.1,          // MEGA PATCH: talentoso mas inconsistente
    "Tímido": 0.95,          // MEGA PATCH: cresce devagar mas não reclama
};

/**
 * §3.1: Position-specific age curves.
 * peak = center of peak zone, declineOnset = when physical decline begins
 * retireMin = earliest retirement age, peakVariance = σ individual spread
 */
const POSITION_AGE_CURVES = {
    ATA: { peak: 27, declineOnset: 31, retireMin: 34, peakVariance: 2 },
    MEI: { peak: 28, declineOnset: 31, retireMin: 34, peakVariance: 2 },
    DEF: { peak: 29, declineOnset: 32, retireMin: 35, peakVariance: 2 },
    GOL: { peak: 30, declineOnset: 34, retireMin: 36, peakVariance: 3 },
};

/**
 * Attribute categories — physical decline fast, mental can improve.
 * §3.1: "Physical stats decline sharply after peak; Mental stats can IMPROVE past 30"
 */
const PHYSICAL_ATTRS = ['attacking'];              // explosive power, speed — fast decline
const TECHNICAL_ATTRS = ['technical'];               // skill — slow decline
const MENTAL_ATTRS = ['tactical', 'creativity'];     // game reading, vision — can IMPROVE past 30, NEVER declines (§3.1)
const DEFENSIVE_ATTR = 'defending';                  // depends on position

/**
 * §3.2: Processa desenvolvimento semanal de um jogador.
 * CA approaches PA asymptotically — the last 5% is hardest.
 * Not every player reaches their potential.
 *
 * Retorna um array de mensagens de mudança.
 */
export function processPlayerDevelopment(player) {
    ensureAttributes(player); // BUG-096: guard contra attributes undefined
    const changes = [];
    const personalityMod = PERSONALITY_GROWTH[player.personality] || 1.0;
    const curve = POSITION_AGE_CURVES[player.position] || POSITION_AGE_CURVES.MEI;

    // Individual variance: cada jogador tem ±variance anos de offset
    // Deterministic per player using id hash (não muda entre semanas)
    const playerVariance = player._peakVariance ?? 0;

    const effectivePeak = curve.peak + playerVariance;
    const effectiveDecline = curve.declineOnset + playerVariance;

    // === CRESCIMENTO NATURAL (pre-peak) ===
    if (player.age < effectivePeak) {
        // §3.2: Gap entre PA e CA determina growth rate (asymptotic)
        const potential = player.potential || (player.ovr + 15);
        const gap = Math.max(0, potential - (player.ovr || 50));

        // Growth chance scales with gap: big gap = easier, small gap = very hard
        // Asymptotic formula: chance = base × (gap / maxGap) × personalityMod
        const ageBonus = player.age < 20 ? 1.5 : player.age < 23 ? 1.2 : 1.0;
        const gapFactor = gap > 20 ? 0.30 : gap > 10 ? 0.18 : gap > 5 ? 0.10 : 0.04;
        const growthChance = gapFactor * personalityMod * ageBonus;

        if (rng.chance(growthChance)) {
            const attr = rng.pick(STAT_KEYS);
            const boost = player.age < 20 ? 2 : 1;
            const oldVal = player[attr];
            // Cap at potential-derived ceiling
            const ceiling = Math.min(99, Math.floor(potential * 1.05));
            player[attr] = Math.min(ceiling, oldVal + boost);
            if (player[attr] > oldVal) {
                changes.push({ type: 'growth', player: player.name, attr, from: oldVal, to: player[attr] });
            }
        }
    }

    // === DECLÍNIO (post-peak, position-specific) ===
    if (player.age >= effectiveDecline) {
        const yearsOverDecline = player.age - effectiveDecline;

        // Physical attributes: decline sharply (§3.1)
        const physDeclineChance = yearsOverDecline * 0.06; // 6% per year
        PHYSICAL_ATTRS.forEach(attr => {
            if (player[attr] !== undefined && rng.chance(physDeclineChance)) {
                const oldVal = player[attr];
                const drop = yearsOverDecline >= 3 ? 2 : 1;
                player[attr] = Math.max(20, oldVal - drop);
                if (player[attr] < oldVal) {
                    changes.push({ type: 'decline', player: player.name, attr, from: oldVal, to: player[attr] });
                }
            }
        });

        // Technical attributes: decline slowly (§3.1)
        const techDeclineChance = yearsOverDecline * 0.03; // 3% per year
        TECHNICAL_ATTRS.forEach(attr => {
            if (player[attr] !== undefined && rng.chance(techDeclineChance)) {
                const oldVal = player[attr];
                player[attr] = Math.max(25, oldVal - 1);
                if (player[attr] < oldVal) {
                    changes.push({ type: 'decline', player: player.name, attr, from: oldVal, to: player[attr] });
                }
            }
        });

        // DEF attribute: position-dependent decline
        // Centerbacks/GKs lose defensive awareness slower (cognitive compensates)
        if (player[DEFENSIVE_ATTR] !== undefined) {
            const defDeclineRate = (player.position === 'DEF' || player.position === 'GOL')
                ? yearsOverDecline * 0.02  // very slow — experience compensates
                : yearsOverDecline * 0.04; // moderate for other positions
            if (rng.chance(defDeclineRate)) {
                const oldVal = player[DEFENSIVE_ATTR];
                player[DEFENSIVE_ATTR] = Math.max(25, oldVal - 1);
                if (player[DEFENSIVE_ATTR] < oldVal) {
                    changes.push({ type: 'decline', player: player.name, attr: DEFENSIVE_ATTR, from: oldVal, to: player[DEFENSIVE_ATTR] });
                }
            }
        }

        // Mental attributes: can IMPROVE past peak! (§3.1)
        // Creativity/positioning grows from experience — 5% chance per year
        const mentalGrowthChance = 0.05 * personalityMod;
        MENTAL_ATTRS.forEach(attr => {
            if (player[attr] !== undefined && rng.chance(mentalGrowthChance)) {
                const oldVal = player[attr];
                player[attr] = Math.min(99, oldVal + 1);
                if (player[attr] > oldVal) {
                    changes.push({ type: 'growth', player: player.name, attr, from: oldVal, to: player[attr] });
                }
            }
        });
    }

    // === APOSENTADORIA (position-aware) ===
    if (player.age >= curve.retireMin) {
        const yearsOverRetireMin = player.age - curve.retireMin;
        const retireChance = (yearsOverRetireMin + 1) * 0.12;
        if (rng.chance(retireChance)) {
            player._retired = true;
            changes.push({ type: 'retirement', player: player.name, age: player.age });
        }
    }
    // BUG-079: safety cap — force-retire if age > 42 (probability of reaching this
    // naturally is ~0, so any player here escaped the stochastic retirement system).
    if (!player._retired && player.age > 42) {
        player._retired = true;
        changes.push({ type: 'retirement', player: player.name, age: player.age });
    }

    // Assign individual peak variance on first run (deterministic from id)
    if (player._peakVariance === undefined) {
        // Hash player id to get ±variance consistently
        const hash = typeof player.id === 'string'
            ? player.id.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
            : (player.id || 0);
        player._peakVariance = (Math.abs(hash) % (curve.peakVariance * 2 + 1)) - curve.peakVariance;
    }

    // Recalc OVR
    recalcOvr(player);

    return changes;
}

/**
 * Envelhece jogadores 1 ano. Chamar 1x por temporada.
 */
export function ageSquad(squad) {
    const events = [];
    squad.forEach(p => {
        p.age++;
        if (p.age >= 35) {
            events.push(`🎂 ${p.name} fez ${p.age} anos. A aposentadoria se aproxima.`);
        }
    });
    return events;
}

/**
 * Form system — tracks últimas 5 participações em jogos
 * Cada jogador tem player.form = { last5: [1,0,-1,1,0], trend: 'hot'|'cold'|'normal' }
 */
export function initForm(player) {
    if (!player.form) {
        player.form = { last5: [], trend: 'normal' };
    }
}

export function updateForm(player, result) {
    initForm(player);
    // result: 1 = bom (titular em vitória/gol), 0 = neutro, -1 = ruim (derrota)
    player.form.last5.push(result);
    if (player.form.last5.length > 5) player.form.last5.shift();

    const avg = player.form.last5.reduce((s, v) => s + v, 0) / player.form.last5.length;
    if (avg >= 0.6) player.form.trend = 'hot';
    else if (avg <= -0.4) player.form.trend = 'cold';
    else player.form.trend = 'normal';
}

export function getFormEmoji(trend) {
    if (trend === 'hot') return '🔥';
    if (trend === 'cold') return '❄️';
    return '';
}

export function getFormModifier(trend) {
    if (trend === 'hot') return 1.08;   // +8% em performance
    if (trend === 'cold') return 0.92;  // -8%
    return 1.0;
}

/**
 * MEGA PATCH: Narrative Pool Expansion — 150+ narrativas ÚNICAS em 6 contextos.
 * Cada contexto tem 25-30 templates. Sem repetição perceptível em soak tests longos.
 * Adiciona contexto 'derby_week' para semanas de clássico.
 */
const NARRATIVES_BY_CONTEXT = {
    moral_high: [
        '🎉 Clima excelente no vestiário! Elenco em alta.',
        '💪 Semana de treinos intensa. Time focado.',
        '🔥 Moral nas alturas. Grupo unido.',
        '⚡ Jogadores motivados, rendimento acima da média.',
        '🌟 Vestiário tranquilo. Tudo preparado.',
        '🎯 Concentração total nos próximos desafios.',
        '🤝 Espírito coletivo em alta. Todos no mesmo ritmo.',
        '😄 Animação contagiante nos treinos desta semana.',
        '🌈 Semana positiva. Elenco com sede de vencer.',
        '🏃 Ritmo forte e alegre nos trabalhos do campo.',
        '🎵 Música no vestiário. Grupo leve e confiante.',
        '☀️ Semana ensolarada dentro e fora do campo.',
        '🫂 Grupo abraçou o técnico no fim do treino.',
        '🧃 Churrasquinho de integração na folga. Grupo conectado.',
        '📸 Jogadores postaram treino nas redes — clima vibrante.',
        '🎤 Karaokê no vestiário. Momento leve pra manter a cabeça no lugar.',
        '🏖️ Jogadores pediram um treino na praia. Técnico autorizou — moral subiu.',
        '🧠 Sessão de mentalização pré-jogo. Grupo focado e sereno.',
        '🤗 Novo jogador foi recebido com aplausos. Integração perfeita.',
        '📊 Análise de vídeo motivou o grupo — viram como podem vencer fácil.',
        '🎊 Aniversário de jogador — bolo no vestiário. Clima de família.',
        '🧘 Sessão de yoga coletiva. Incomum, mas o grupo adorou.',
        '⚽ Rachinha com aposta de sorvete. Clima descontraído mas competitivo.',
        '🗣️ Líder do elenco fez discurso espontâneo. Grupo de arrepiou.',
        '📰 Mídia elogiou o trabalho tático. Moral do grupo subiu naturalmente.',
    ],
    moral_low: [
        '😞 Ambiente pesado após os resultados recentes.',
        '🥀 Elenco abatido. Treinamento irregular.',
        '⚠️ Tensão no grupo. Técnico reuniu o elenco.',
        '💔 Sequência ruim afeta a confiança.',
        '🌧️ Semana difícil. Grupo precisa se reencontrar.',
        '😤 Cobrança interna. Jogadores insatisfeitos.',
        '🔇 Silêncio pesado no vestiário. Ninguém fala muito.',
        '👁️ Olhares baixos. Confiança no chão.',
        '🤕 Treino abaixo do esperado. Foco comprometido.',
        '📉 Semana de reflexão forçada após o mau momento.',
        '🚨 Diretoria monitorando de perto o estado do elenco.',
        '😶 Grupo fechado. Poucas conversas, muitas dúvidas.',
        '🪵 Treino pesado como punição. Técnico exigiu entrega.',
        '🗞️ Matéria na imprensa criticou postura do elenco. Desgaste visível.',
        '💢 Briga entre dois jogadores no treino. Staff separou.',
        '🚪 Jogador pediu reunião com a diretoria. Quer sair.',
        '🧊 Clima gelado no ônibus do time. Zero conversa.',
        '📵 Técnico proibiu celulares no CT. Punição coletiva.',
        '🛏️ Jogadores chegaram atrasados ao treino. Falta de compromisso.',
        '😤 Torcida organizou protesto no portão do CT.',
        '🤦 Treino tático virou caos. Esquema não funciona.',
        '😔 Veterano sussurrou: "Esse grupo não quer nada."',
        '🚑 Jogador saiu machucado do treino pesado. Clima piorou.',
        '📋 Conselho deliberativo questionou o trabalho do técnico.',
        '😰 Técnico admitiu em entrevista: "É o pior momento da minha gestão."',
    ],
    relegation: [
        '😰 Pressão máxima. Cada ponto é vital.',
        '🧨 Semana decisiva na luta contra o rebaixamento.',
        '🏃 Time treinou dobrado, consciente da situação.',
        '😓 Clima pesado. Rebaixamento à vista.',
        '🔥 Tudo ou nada nas próximas rodadas.',
        '🪖 Mentalidade de batalha. Cada jogo, uma final.',
        '📣 Técnico convocou reunião de emergência na semana.',
        '🧱 Muralha defensiva sendo construída nos treinos.',
        '💢 Raiva canalizada. Time quer sair do sufoco.',
        '🎲 Semana de apostas. O grupo precisa entregar.',
        '⏳ Tempo curto, pressão grande. Grupo concentrado.',
        '🌊 Nado contra a maré — mas o elenco não desistiu.',
        '🚨 Torcida foi ao CT cobrar. Técnico ouviu em silêncio.',
        '📜 Diretoria entregou ultimato: "Vençam ou caem todos."',
        '🙏 Jogadores rezaram juntos antes do treino.',
        '⛈️ Temporal durante o treino. Ninguém saiu do campo.',
        '🪓 Técnico cortou 3 jogadores da concentração. Cirurgião.',
        '💀 "Quem não estiver disposto a morrer em campo, pode ir embora."',
        '🧤 Goleiro fez palestra motivacional. Grupo chorou.',
        '📺 Torcida fez vigília na porta do hotel de concentração.',
        '🛡️ Treino exclusivo de marcação. Zero tolerância com erros.',
        '🗡️ "É guerra. Não tem bonito, tem que ser eficiente."',
        '🏴 Bandeirão da torcida cobriu todo o CT: "RAÇA OU VERGONHA".',
        '🤜 Técnico deu soco na lousa tática. "ACORDA!"',
        '🎗️ Time usou faixa preta no braço: "Luto pelo rebaixamento não acontecer."',
    ],
    title_race: [
        '👑 Concentração total na disputa pelo título.',
        '🏆 Cada treino é tratado como final.',
        '🎯 Grupo blindado. Foco no campeonato.',
        '⭐ Momento histórico se aproxima.',
        '🥇 Semana decisiva. Pressão positiva no grupo.',
        '🔒 Vestiário fechado para o exterior. Zero distração.',
        '🏅 Fome de título. Jogadores em estado de graça.',
        '✨ Semana especial. Sente-se algo diferente no ar.',
        '🚀 Energia de campeão. O grupo acredita.',
        '🌠 Treinos intensos mas alegres. Título à vista.',
        '💎 O mais difícil está perto. Time focado.',
        '🎖️ Legado sendo construído. Semana histórica em potencial.',
        '🔬 Análise cirúrgica do adversário. Nada ao acaso.',
        '🧊 Concentração absoluta. CT parece centro de comando militar.',
        '🦁 "Somos leões. Esse título é NOSSO." — capitão no vestiário.',
        '📿 Cada jogador tem seu ritual pré-jogo. Superstições respeitadas.',
        '🏟️ Torcida esgotou ingressos pra próximos 3 jogos.',
        '📰 Manchete do jornal: "É agora ou nunca para o {teamName}."',
        '🎬 Departamento de vídeo preparou montagem motivacional. Arrepiou.',
        '🗣️ Ex-jogador do clube visitou o CT. "Ganhem isso por mim."',
        '💫 Tática ensaiada 50 vezes. Time decorou cada movimento.',
        '🧠 Psicólogo do clube fez sessão individual com cada jogador.',
        '🛡️ Defesa treinou 4 horas seguidas. Perfeição defensiva.',
        '⚡ Contra-ataque ensaiado funciona em 3 segundos. Mortífero.',
        '🎺 Torcida cantou no portão do CT até meia-noite.',
    ],
    mid_table: [
        '📊 Semana de ajustes táticos.',
        '🔄 Rotação no treino. Todos os jogadores envolvidos.',
        '📝 Técnico analisa próximos adversários.',
        '🏃 Ritmo forte nos treinos.',
        '💬 Reunião de equipe. Foco nos detalhes.',
        '🧩 Semana de encaixe do esquema tático.',
        '🔍 Vídeos de oposição estudados com atenção.',
        '⚙️ Ajustes finos na mecânica coletiva.',
        '📅 Semana de preparação sem novidades negativas.',
        '🎽 Treino físico intenso. Elenco em boa forma.',
        '🧘 Semana tranquila. Grupo confiante no processo.',
        '🤔 Análise pós-rodada. Time busca consistência.',
        '☕ Técnico tomou café com os jogadores. Papo reto sobre metas.',
        '🧪 Teste de novo esquema tático no treino. Resultados promissores.',
        '📐 Treino focado em bola parada. Cobrança de falta e escanteio.',
        '🏋️ Preparação física reforçada. Semana de carga pesada.',
        '🤝 Diretoria e comissão técnica alinhados. Sem ruído.',
        '📋 Lista de reforços sendo avaliada pela diretoria.',
        '🧃 Folga monitorada. Jogadores curtiram mas voltaram focados.',
        '📈 Estatísticas mostram melhora em passes completados.',
        '🎓 Sub-20 treinaram com o profissional. Rodízio de experiência.',
        '🌡️ Departamento médico liberou todos. Sem lesionados na semana.',
        '⚽ Coletivo de quinta-feira definiu o time titular.',
        '🗺️ Scout apresentou relatório sobre próximo adversário.',
        '📺 Jogo transmitido na TV. Jogadores querem mostrar serviço.',
    ],
    derby_week: [
        '⚡ SEMANA DE CLÁSSICO! CT em clima de guerra.',
        '🔥 Rivalidade histórica. Grupo concentrado e mordido.',
        '🏟️ Ingressos esgotados em 30 minutos. Caldeirão garantido.',
        '🦅 "Vamos CALAR eles." — capitão no vestiário.',
        '📺 Cobertura especial da mídia. Câmeras por todo o CT.',
        '🎭 Drama e tensão: ex-jogador do rival agora joga aqui.',
        '🗞️ Jornal publicou retrospecto: 47 clássicos, 18 vitórias.',
        '🔒 Portões do CT fechados. Treino secreto.',
        '💀 Torcida adversária provocou nas redes. Elenco viu.',
        '🤬 Jogador soltou: "Perder pra eles NÃO."',
        '🏴 Faixa da torcida: "DERROTEM OU NEM VOLTEM."',
        '📿 Ritual pré-clássico. Cada um tem o seu.',
        '🧠 Vídeo com 10 gols históricos em clássicos. Motivação.',
        '⚔️ Treino com marcação dobrada. Simulando o inferno.',
        '🎪 Semana de circo na mídia, paz no CT. Grupo blindado.',
    ],
};

/**
 * Seleciona narrativa contextual baseada em posição, moral e sequência.
 *
 * @param {{ position: number, totalTeams: number, moral: number, streak: number }} ctx
 * @returns {string}
 */
export function pickNarrative(ctx) {
    const { position = 10, totalTeams = 20, moral = 50, streak = 0 } = ctx;
    let key;
    if (moral > 65 && position <= 3) {
        key = 'title_race';
    } else if (position >= totalTeams - 3) {
        key = 'relegation';
    } else if (moral < 40) {
        key = 'moral_low';
    } else if (moral > 65) {
        key = 'moral_high';
    } else {
        key = 'mid_table';
    }
    const pool = NARRATIVES_BY_CONTEXT[key];
    return pool[Math.floor(rng() * pool.length)];
}

/**
 * Dressing Room Dynamics — relações no vestiário
 * - Cliques: jogadores com alta moral formam grupo positivo
 * - Cancers: jogadores insatisfeitos contaminam moral
 * - Leader: jogador mais velho com moral alta estabiliza o grupo
 *
 * @param {object[]} squad
 * @param {{ position?: number, totalTeams?: number, streak?: number }} [ctx={}]  SPEC-146 context
 */
export function processDressingRoom(squad, ctx = {}) {
    const events = [];

    // Find leader
    const candidates = squad
        .filter(p => p.age >= 28 && (p.moral || 50) >= 65 && !p.injury)
        .sort((a, b) => (b.moral || 50) - (a.moral || 50));
    const leader = candidates[0] || null;

    // Count unhappy players
    const unhappy = squad.filter(p => (p.moral || 50) < 30 && !p.injury);
    const happy = squad.filter(p => (p.moral || 50) > 75);

    // Average moral for narrative context
    const avgMoral = squad.length
        ? squad.reduce((s, p) => s + (p.moral || 50), 0) / squad.length
        : 50;

    // Leader stabilizes
    if (leader && unhappy.length > 0 && unhappy.length <= 3) {
        unhappy.forEach(p => {
            p.moral = Math.min(100, (p.moral || 50) + 3);
        });
        events.push(`👔 ${leader.name} conversou com jogadores insatisfeitos. Moral melhorou.`);
    }

    // Cancer effect: if 4+ unhappy, they drag others down
    if (unhappy.length >= 4) {
        squad.forEach(p => {
            if ((p.moral || 50) > 40) {
                p.moral = Math.max(0, (p.moral || 50) - 2);
            }
        });
        events.push(`☠️ Vestiário em crise! ${unhappy.length} jogadores insatisfeitos contaminam o grupo.`);
    }

    // Good vibes: if 6+ happy, emit contextual narrative (SPEC-146 expansion)
    if (happy.length >= 6) {
        squad.forEach(p => {
            p.moral = Math.min(100, (p.moral || 50) + 1);
        });
        events.push(pickNarrative({
            position: ctx.position,
            totalTeams: ctx.totalTeams,
            moral: avgMoral,
            streak: ctx.streak,
        }));
    }

    // Captain system: highest OVR veteran gets +2 moral stability
    if (leader) {
        leader._isCaptain = true;
    }

    return { events, leader };
}

/**
 * Contract Renewal — negociação de renovação
 */
export function generateRenewalOffer(player) {
    const baseSalary = player.salary || 5000;
    const ageFactor = player.age > 30 ? 0.8 : player.age < 22 ? 1.5 : 1.2;
    const formFactor = player.form?.trend === 'hot' ? 1.3 : player.form?.trend === 'cold' ? 0.9 : 1.0;
    const personalityFactor = player.personality === 'Ambicioso' ? 1.4 : player.personality === 'Profissional' ? 1.0 : 1.1;

    const demandedSalary = Math.floor(baseSalary * ageFactor * formFactor * personalityFactor);
    const weeks = player.age > 30 ? 38 : player.age < 22 ? 114 : 76; // 1, 2, or 3 seasons

    // Happiness affects willingness
    const willRenew = (player.moral || 50) > 30;

    return {
        playerId: player.id,
        playerName: player.name,
        currentSalary: baseSalary,
        demandedSalary,
        weeks,
        willRenew,
        personality: player.personality || 'Normal',
        reason: !willRenew ? `${player.name} está insatisfeito e recusa renovar.` : null,
    };
}

export function acceptRenewal(player, offer) {
    player.contract = { weeksLeft: offer.weeks, salary: offer.demandedSalary };
    player.salary = offer.demandedSalary;
    player.moral = Math.min(100, (player.moral || 50) + 10);
    return { success: true, msg: `${player.name} renovou por ${offer.weeks} semanas (R$ ${(offer.demandedSalary / 1000).toFixed(0)}K/sem)!` };
}

/**
 * Tactic Counter System — rock-paper-scissors
 * Returns effectiveness modifier for attacker's tactic vs defender's tactic
 */
export const TACTIC_COUNTERS = {
    // [attacker][defender] = modifier
    normal:     { normal: 1.0, offensive: 1.0, defensive: 1.0, pressing: 1.0, counter: 1.0, possession: 1.0 },
    offensive:  { normal: 1.1, offensive: 1.0, defensive: 0.7, pressing: 1.15, counter: 0.8, possession: 1.1 },
    defensive:  { normal: 0.9, offensive: 1.3, defensive: 1.0, pressing: 0.9, counter: 1.1, possession: 0.85 },
    pressing:   { normal: 1.05, offensive: 0.85, defensive: 1.1, pressing: 1.0, counter: 0.7, possession: 1.2 },
    counter:    { normal: 1.0, offensive: 1.2, defensive: 0.9, pressing: 1.3, counter: 1.0, possession: 0.9 },
    possession: { normal: 1.0, offensive: 0.9, defensive: 1.15, pressing: 0.8, counter: 1.1, possession: 1.0 },
};

/**
 * Narração contextual por tática
 */
// P1-5: Variedade narração 5x — cada categoria 10-15+ templates únicos
export const TACTIC_NARRATION = {
    normal: {
        chance: [
            "{atk} arma jogada pelo meio!", "{atk} tenta triangulação!", "{atk} avança pela intermediária!",
            "{atk} cria oportunidade!", "{atk} chega com perigo!", "{atk} acelera o jogo!",
            "{atk} tabela e abre espaço!", "{atk} infiltra na área!", "{atk} encontra brecha na defesa!",
            "{atk} testa o goleiro do {def}!", "{atk} cruza com perigo!", "{atk} chega na linha de fundo!"
        ],
        goal: [
            "{atk} marca um belo gol!", "{atk} balança as redes!", "{atk} abre o placar com categoria!",
            "{atk} GOL! Bola no fundo da rede!", "{atk} converte a chance!", "{atk} faz o que tinha que fazer!",
            "{atk} bate forte e marca!", "{atk} de placa!", "{atk} explode pra rede!",
            "{atk} marca em jogada ensaiada!", "GOOOL DO {atk}!", "{atk} acerta o canto!"
        ],
        miss: [
            "{atk} arrisca mas passa por cima!", "{atk} chuta e o goleiro segura!", "{atk} desperdiça!",
            "{atk} pra fora! Quase!", "{atk} no travessão!", "{atk} chuta na rede pelo lado de fora!",
            "{atk} tenta de cabeça mas erra o alvo!", "{atk} chuta torto!", "{atk} pega mal na bola!",
            "{atk} bate na trave!", "{atk} isolado!"
        ],
        save: [
            "Defesaça do goleiro do {def}!", "O goleiro do {def} se estica e salva!", "Grande defesa!",
            "Defesa milagrosa!", "Goleiro do {def} no lugar certo!", "Salva o {def}!",
            "Que defesa!", "O goleiro do {def} agarra firme!", "Defesa em dois tempos!",
            "Goleiro do {def} espalma!", "Defesona!"
        ],
        filler: [
            "{atk} roda a bola no meio.", "Jogo equilibrado no momento.", "{def} recua e espera.",
            "Posse de bola dividida.", "Jogo cadenciado.", "{atk} controla o ritmo.",
            "Disputa de meio-campo.", "{def} marca com atenção.", "Bola no meio de campo.",
            "{atk} estuda a defesa do {def}.", "Pegada forte de ambos os lados.", "Jogo morno."
        ]
    },
    offensive: {
        chance: [
            "{atk} sobe em bloco! Pressão total!", "{atk} ataca com 4 jogadores!", "{atk} joga no abafa!",
            "{atk} avança em ataque maciço!", "{atk} massacra a defesa adversária!", "{atk} joga linha alta!",
            "{atk} ataca com tudo!", "{atk} parte pra cima!", "{atk} cerca a área do {def}!",
            "{atk} bombardeia o gol!", "{atk} ataca com volume!", "{atk} mantém pressão alta!"
        ],
        goal: [
            "{atk} marca de goleada! O jogo é ataque!", "{atk} GOOOL! O jogo ofensivo funciona!", "{atk} explode na frente!",
            "{atk} marca de bandeja!", "{atk} GOL após pressão constante!", "{atk} converte com facilidade!",
            "{atk} GOOOL! Ataque imparável!", "{atk} arrasa! Que gol!", "{atk} faz parecer fácil!",
            "{atk} cravar o gol!", "{atk} ataque-relâmpago!", "{atk} GOOOL espetacular!"
        ],
        miss: [
            "{atk} se lança ao ataque mas perde a bola!", "{atk} arrisca de longe! Passou!",
            "{atk} cabeceia e tira tinta!", "{atk} chuta forte mas erra o alvo!", "{atk} desperdiça gol feito!",
            "{atk} pega mal e a bola sobe!", "{atk} arrisca chute torto!", "{atk} perde gol incrível!"
        ],
        save: [
            "Milagre do goleiro do {def}! Quase gol!", "O goleiro do {def} salva o time!",
            "Defesaça espetacular do {def}!", "{def} se segura no goleiro!", "O goleiro do {def} evita o pior!",
            "Defesa heróica do {def}!", "{def} está vivo graças ao goleiro!"
        ],
        filler: [
            "{atk} mantém pressão ofensiva. {def} sofre.", "Jogo aberto, {atk} domina o campo de ataque.",
            "{atk} ataca incessantemente.", "{def} se defende como pode.", "{atk} põe muita gente no ataque.",
            "Festival ofensivo do {atk}!", "{def} encurralado.", "{atk} não dá trégua.",
            "Pressão sufocante do {atk}.", "{def} respira mal."
        ]
    },
    defensive: {
        chance: [
            "{atk} sai em contra-ataque rápido!", "{atk} rouba a bola e sai correndo!", "{atk} lança na velocidade!",
            "{atk} explora espaço deixado!", "{atk} corre no contragolpe!", "{atk} aproveita brecha!",
            "{atk} surpreende com velocidade!", "{atk} dispara em transição!", "{atk} pega o {def} desligado!"
        ],
        goal: [
            "{atk} marca no contra-ataque! Mortal!", "{atk} GOOOL de contra! Eficiência pura!", "{atk} letal na saída!",
            "{atk} GOL fulminante na transição!", "{atk} converte contragolpe!", "{atk} mata na velocidade!",
            "{atk} GOOOL! Contra-ataque cirúrgico!", "{atk} marca em jogada relâmpago!"
        ],
        miss: [
            "{atk} tenta o contra mas perde o timing!", "{atk} chega mas finaliza mal!",
            "{atk} sai rápido mas erra a conclusão!", "{atk} dispara mas chuta isolado!"
        ],
        save: [
            "O goleiro do {def} fecha o ângulo!", "Salvou! {def} sobrevive!",
            "Defesaça do {def}!", "{def} agarra no contra!"
        ],
        filler: [
            "{atk} recua e fecha os espaços.", "Jogo truncado. {atk} espera o momento certo.",
            "{def} tenta furar a retranca.", "{atk} compacto na defesa.", "Marcação cerrada.",
            "{def} bate na muralha do {atk}.", "{atk} sufoca o jogo.", "Cadência baixa.",
            "{def} sem espaço pra criar."
        ]
    },
    pressing: {
        chance: [
            "{atk} rouba na saída de bola do {def}!", "{atk} pressiona e recupera!", "{atk} não deixa {def} respirar!",
            "{atk} ataca em cima da marcação!", "{atk} encurta espaços!", "{atk} sufoca o adversário!",
            "{atk} rouba alta e parte!", "{atk} marca por pressão!"
        ],
        goal: [
            "{atk} marca após pressão alta! Asfixiou!", "{atk} GOOOL! Pressionou e converteu!", "{atk} rouba e marca!",
            "{atk} GOL após roubada!", "{atk} pressiona e mata!", "{atk} converte erro do {def}!"
        ],
        miss: [
            "{atk} pressiona mas se desgasta!", "{atk} erra na pressão e abre espaço!",
            "{atk} cansa e perde objetivo!"
        ],
        save: [
            "O goleiro do {def} segura firme!", "Pressão do {atk} não consegue furar!",
            "Defesaça! Ataque parou na trave!"
        ],
        filler: [
            "{atk} mantém marcação altíssima. {def} sem ar.", "Intensidade do {atk} é impressionante.",
            "{def} não consegue sair jogando.", "{atk} sufoca!", "Pressão alta funcionando!",
            "{def} sem espaço.", "{atk} não dá tempo de pensar.", "Jogo intenso!"
        ]
    },
    counter: {
        chance: [
            "{atk} absorve e sai em velocidade!", "{atk} arma o contra-ataque mortal!", "{atk} espera, rouba e lança!",
            "{atk} segura e dispara!", "{atk} aguarda momento e parte!", "{atk} explora vazio!"
        ],
        goal: [
            "{atk} fulmina no contra-ataque! GOOOL!", "{atk} mata o jogo na transição!", "{atk} eficiente como sempre!",
            "{atk} GOOOL letal de contra!", "{atk} converte na primeira chance!"
        ],
        miss: [
            "{atk} tenta o contra mas isolou!", "{atk} sai rápido mas errou o passe final!",
            "{atk} dispara mas perde a bola!"
        ],
        save: [
            "Defesaça! O goleiro do {def} estava preparado!", "O contra do {atk} é barrado!",
            "{def} agarra no contragolpe!"
        ],
        filler: [
            "{atk} espera pacientemente.", "{def} tem a bola mas não acha espaço.", "Jogo de xadrez tático.",
            "{atk} retraído estuda momento.", "{def} ataca mas {atk} segura.", "Disputa estratégica.",
            "{atk} aguarda o erro do {def}."
        ]
    },
    possession: {
        chance: [
            "{atk} troca passes e acha o espaço!", "{atk} desfaz a marcação com posse!", "{atk} cansa o {def} com toques!",
            "{atk} circula a bola e penetra!", "{atk} chega após paciente armação!", "{atk} cria com posse!"
        ],
        goal: [
            "{atk} marca após 25 toques! Posse letal!", "{atk} GOOOL! A paciência pagou!", "{atk} perfura com maestria!",
            "{atk} GOL após posse longa!", "{atk} converte armação minuciosa!"
        ],
        miss: [
            "{atk} tenta mas falta objetividade!", "{atk} troca muitos passes e perde!",
            "{atk} demora demais e perde a chance!"
        ],
        save: [
            "O goleiro do {def} faz a leitura!", "Boa defesa! {def} resiste à posse!",
            "Defesaça! {def} aguenta!"
        ],
        filler: [
            "{atk} domina 65% da posse.", "Toque, toque, toque... {def} corre atrás.", "{atk} não se apressa.",
            "{atk} mantém o ritmo.", "{def} cansa de correr.", "{atk} dita o tempo.",
            "Posse imensa do {atk}.", "{def} sem a bola."
        ]
    }
};

function recalcOvr(player) {
    ensureAttributes(player); // SCHEMA-UNIFIED: guard root-level attrs
    // Weighted OVR por posição usando schema unificado
    switch (player.position) {
        case "GOL": player.ovr = Math.floor(player.defending * 0.45 + player.tactical * 0.25 + player.technical * 0.20 + player.creativity * 0.05 + player.attacking * 0.05); break;
        case "DEF": player.ovr = Math.floor(player.defending * 0.50 + player.tactical * 0.25 + player.attacking * 0.10 + player.technical * 0.10 + player.creativity * 0.05); break;
        case "MEI": player.ovr = Math.floor(player.creativity * 0.30 + player.technical * 0.25 + player.tactical * 0.20 + player.defending * 0.10 + player.attacking * 0.15); break;
        case "ATA": player.ovr = Math.floor(player.attacking * 0.45 + player.technical * 0.20 + player.creativity * 0.20 + player.tactical * 0.10 + player.defending * 0.05); break;
        default: player.ovr = Math.floor((player.attacking + player.technical + player.tactical + player.defending + player.creativity) / 5);
    }

    // Hedonic Pricing recalculation upon OVR change
    player.marketValue = calcMarketValue({
        playerOvr: player.ovr,
        playerAge: player.age || 25,
        playerPotential: player.potential,
        playerContract: player.contract?.weeksLeft ?? 26,
        playerForm: player.form?.trend || 0
    });
}
