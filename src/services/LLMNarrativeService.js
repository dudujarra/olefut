/**
 * LLMNarrativeService — SPEC-167
 *
 * Camada pública de narrativa baseada em LLM com fallback determinístico
 * por templates. Três casos de uso:
 *
 *   1. postMatchAnalysis(matchData) — narrativa pós-jogo
 *   2. managerAdvice(matchCtx)       — conselho pré-jogo do auxiliar
 *   3. boardReaction(event)          — comunicado in-character da diretoria
 *
 * Regras-mãe (ver SPEC-167):
 *   - Não-bloqueante: timeout 3000ms, fallback síncrono garantido
 *   - Cache (memoize) com cap LRU em 100 entradas
 *   - LLM (AutoPlayLLMBridge → WebLLM Llama 3.2 1B) é opt-in
 *   - Templates determinísticos sempre disponíveis (BR-PT)
 */

const DEFAULT_TIMEOUT_MS = 3000;
const CACHE_MAX = 100;

// SPEC-174: localStorage key for persisted user toggle.
const LLM_TOGGLE_STORAGE_KEY = 'elifoot_llm_enabled';

function readPersistedToggle() {
    try {
        if (typeof localStorage === 'undefined') return false;
        return localStorage.getItem(LLM_TOGGLE_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function writePersistedToggle(enabled) {
    try {
        if (typeof localStorage === 'undefined') return;
        if (enabled) localStorage.setItem(LLM_TOGGLE_STORAGE_KEY, '1');
        else localStorage.removeItem(LLM_TOGGLE_STORAGE_KEY);
    } catch {
        // Storage may be blocked (private mode, quota); ignore — runtime flag still works.
    }
}

/**
 * Hash determinístico simples (FNV-1a). Usado para escolha de template
 * sem Math.random — mesmo input → mesma frase.
 */
function fnv1aHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
    }
    return h >>> 0;
}

/**
 * Race uma Promise contra timeout. Resolve com sentinel `__timeout__`
 * em vez de rejeitar, para o caller fazer fallback síncrono.
 */
function raceWithTimeout(promise, ms) {
    return new Promise((resolve) => {
        const t = setTimeout(() => resolve({ __timeout__: true }), ms);
        Promise.resolve(promise).then(
            (val) => { clearTimeout(t); resolve({ value: val }); },
            (err) => { clearTimeout(t); resolve({ error: err }); }
        );
    });
}

// ============================================================
// TEMPLATES — pt-BR, 2-3 frases. Determinísticos por hash.
// ============================================================

const POST_MATCH_TEMPLATES = {
    bigWin: [
        '{home} atropelou {away} por {hg} a {ag}. Apresentação dominante do início ao fim. A torcida saiu em êxtase.',
        'Goleada histórica: {home} {hg} x {ag} {away}. O time funcionou nos quatro setores. Resultado que vale como recado para a próxima rodada.',
        'Vitória inquestionável de {home} sobre {away} por {hg} a {ag}. Confiança em alta e moral renovada no vestiário.',
    ],
    win: [
        'Vitória sólida de {home} sobre {away} por {hg} a {ag}. Time controlou os momentos-chave e levou os três pontos.',
        '{home} venceu {away} por {hg} a {ag}. Resultado importante para a campanha, mesmo com alguns sustos.',
        'Boa resposta de {home} no {hg} a {ag} contra o {away}. Postura competitiva e eficiência ofensiva.',
    ],
    narrowWin: [
        'Vitória sofrida de {home} por {hg} a {ag} sobre {away}. O time segurou o placar nos minutos finais.',
        '{home} {hg} x {ag} {away} em jogo apertado. Os três pontos vêm com mais alívio do que celebração.',
        'Triunfo magro mas precioso: {home} {hg} x {ag} {away}. A defesa segurou o que veio.',
    ],
    draw: [
        'Empate em {hg} a {ag} entre {home} e {away}. Resultado deixa gosto ambíguo: nem comemora, nem chora.',
        '{home} {hg} x {ag} {away} — empate equilibrado. Os dois lados terminaram contentes em fases distintas do jogo.',
        'Ficou no {hg} a {ag} entre {home} e {away}. Um ponto que pode pesar mais à frente.',
    ],
    narrowLoss: [
        'Derrota apertada de {home} para {away} por {hg} a {ag}. O time competiu, mas faltou eficiência.',
        '{home} {hg} x {ag} {away} — pouco para tirar de positivo apesar da entrega. Pequenos detalhes definiram.',
        'Resultado adverso: {home} {hg} x {ag} {away}. Há muito o que conversar no vestiário.',
    ],
    loss: [
        'Derrota de {home} para {away} por {hg} a {ag}. Apresentação irregular e setores não responderam.',
        '{home} {hg} x {ag} {away} — resultado preocupante. A diretoria deve cobrar respostas rápidas.',
        'Tropeço duro de {home} contra {away}. O {hg} a {ag} expõe limitações que precisam ser corrigidas.',
    ],
    humiliation: [
        'Humilhação histórica: {home} {hg} x {ag} {away}. Vergonha pública e crise potencial no vestiário.',
        '{home} {hg} x {ag} {away}: goleada sofrida que vira ferida aberta. A semana será longa.',
        'Vexame de {home} ao perder por {hg} a {ag} para {away}. Reconstrução começa agora.',
    ],
};

const MANAGER_ADVICE_TEMPLATES = {
    bigAdvantage: [
        'Você tem vantagem técnica clara (OVR {ownOvr} vs {oppOvr}). Mantenha {formation} ofensivo e pressione alto. Confie no elenco.',
        'O elenco é superior ao do {opp}. Aposte em {formation} com tática agressiva e finalize cedo para não dar esperança.',
        'Diferença técnica favorável: {ownOvr} contra {oppOvr}. {formation} ofensivo é a leitura óbvia, mas atenção ao contra-ataque.',
    ],
    advantage: [
        'Você é favorito moderado. {formation} continua sendo bom, mas considere reforçar o meio para controlar o ritmo.',
        'Pequena vantagem técnica. Mantenha {formation} e o equilíbrio. Não deixe o adversário forçar erros.',
        'Favorito apertado. {formation} normal é prudente — não tente blitz prematura.',
    ],
    even: [
        'Jogo equilibrado pela frente. {formation} com tática normal é o mais seguro. Vale assistir os primeiros 20 minutos antes de mudar nada.',
        'Confronto parelho. Olho no meio-campo: quem dominar ali vence. Considere fechar a defesa nos minutos finais.',
        'Sem favorito claro. Confie em {formation} e ajuste no intervalo conforme leitura do jogo.',
    ],
    underdog: [
        'O {opp} é favorito. Aposte em {formation} defensivo ou contra-ataque. Um ponto já é resultado aceitável.',
        'Você é azarão. Compactar atrás e explorar transição rápida pode surpreender. Não abra o jogo.',
        'Inferioridade técnica clara. Tática defensiva e bola parada são suas armas principais.',
    ],
    bigUnderdog: [
        'Missão difícil contra {opp} (OVR {oppOvr} vs {ownOvr}). Foco total em defender e roubar bola em transição. Pé no chão.',
        'Cenário adverso: {opp} bem mais forte. Defenda em bloco baixo, busque um gol oportunista. Sobrevivência conta.',
        'O {opp} é favoritíssimo. Defensivo extremo e aproveitar erro adversário. Não há vergonha em jogar para empatar.',
    ],
};

const BOARD_REACTION_TEMPLATES = {
    title: [
        'A diretoria está em festa pelo título conquistado. Sua continuidade no comando é certa. O elenco terá investimento ampliado na próxima temporada.',
        'Conquistar o título consolida sua posição. A diretoria parabeniza publicamente e renova a confiança. Há margem para projetos maiores.',
        'Título celebrado pela diretoria. Reconhecemos o trabalho consistente e queremos manter o ciclo vencedor. Bonificação a caminho.',
    ],
    promotion: [
        'O acesso conquistado mudou o patamar do clube. A diretoria mostra gratidão pública e promete reforços para a divisão superior.',
        'Subir de divisão era o objetivo central, e foi entregue. A diretoria reafirma a parceria e abre crédito para o próximo desafio.',
        'Acesso garantido. A diretoria está satisfeita, mas já cobra planejamento sério para se manter na divisão de cima.',
    ],
    relegation: [
        'O rebaixamento gerou crise interna. A diretoria está profundamente decepcionada e fará uma reavaliação completa do comando técnico.',
        'Cair de divisão é fracasso inaceitável. A diretoria não esconde a frustração e estuda mudanças estruturais imediatas.',
        'Rebaixamento dói. A diretoria emite nota dura cobrando responsabilidades e prometendo reconstrução. O futuro do técnico está em aberto.',
    ],
    sacking_risk: [
        'A diretoria emite alerta formal: os resultados estão muito abaixo do esperado. Sua permanência será reavaliada nas próximas semanas.',
        'Reunião tensa na diretoria. Sem reação imediata, mudanças no comando técnico não estão descartadas.',
        'A confiança da diretoria caiu para níveis críticos. Próximas rodadas serão decisivas para sua permanência.',
    ],
    win_streak: [
        'A diretoria parabeniza publicamente a sequência de vitórias. O trabalho dá frutos e o vestiário responde. Continue assim.',
        'Sequência vitoriosa anima a diretoria. Reconhecimento oficial e sinal verde para planos futuros.',
        'A boa fase é destacada pela diretoria, que pretende reforçar a confiança no plantel. Mantenha o foco.',
    ],
    humiliation: [
        'A goleada sofrida choca a diretoria. Cobrança imediata por explicações no vestiário. Reincidência terá consequências severas.',
        'Humilhação pública. A diretoria exige resposta rápida e estuda medidas internas para evitar nova vergonha.',
        'Resultado vexatório acende sinal vermelho na diretoria. Reunião extraordinária convocada — sua liderança será testada.',
    ],
    default: [
        'A diretoria acompanha de perto os acontecimentos. Aguarda evolução antes de qualquer manifestação oficial.',
        'A diretoria optou por reserva sobre o momento. O trabalho continua sob avaliação interna.',
        'Sem manifestação oficial por agora. A diretoria prefere conversar a portas fechadas.',
    ],
};

/**
 * Escolhe template determinístico baseado em hash do input.
 */
function pickTemplate(bucket, seedKey) {
    if (!bucket || bucket.length === 0) return '';
    const idx = fnv1aHash(seedKey) % bucket.length;
    return bucket[idx];
}

function fillTemplate(tpl, vars) {
    return Object.keys(vars).reduce(
        (acc, k) => acc.split(`{${k}}`).join(String(vars[k])),
        tpl
    );
}

// ============================================================
// FALLBACK BUILDERS
// ============================================================

function buildPostMatchTemplate(input) {
    const home = String(input?.homeTeam || 'A equipe');
    const away = String(input?.awayTeam || 'o adversário');
    const hg = Number(input?.homeGoals || 0);
    const ag = Number(input?.awayGoals || 0);
    const diff = hg - ag;
    const managerSide = input?.managerSide;
    // Determine bucket from manager perspective if available, else neutral
    let bucket;
    if (managerSide === 'home' || managerSide === 'away') {
        const myG = managerSide === 'home' ? hg : ag;
        const oppG = managerSide === 'home' ? ag : hg;
        const mDiff = myG - oppG;
        if (mDiff >= 3) bucket = POST_MATCH_TEMPLATES.bigWin;
        else if (mDiff === 2) bucket = POST_MATCH_TEMPLATES.win;
        else if (mDiff === 1) bucket = POST_MATCH_TEMPLATES.narrowWin;
        else if (mDiff === 0) bucket = POST_MATCH_TEMPLATES.draw;
        else if (mDiff === -1) bucket = POST_MATCH_TEMPLATES.narrowLoss;
        else if (mDiff >= -3) bucket = POST_MATCH_TEMPLATES.loss;
        else bucket = POST_MATCH_TEMPLATES.humiliation;
    } else {
        if (Math.abs(diff) >= 4) bucket = diff > 0 ? POST_MATCH_TEMPLATES.bigWin : POST_MATCH_TEMPLATES.humiliation;
        else if (Math.abs(diff) >= 2) bucket = diff > 0 ? POST_MATCH_TEMPLATES.win : POST_MATCH_TEMPLATES.loss;
        else if (Math.abs(diff) === 1) bucket = diff > 0 ? POST_MATCH_TEMPLATES.narrowWin : POST_MATCH_TEMPLATES.narrowLoss;
        else bucket = POST_MATCH_TEMPLATES.draw;
    }
    const seed = `${home}|${away}|${hg}|${ag}`;
    const tpl = pickTemplate(bucket, seed);
    return fillTemplate(tpl, { home, away, hg, ag });
}

function buildManagerAdviceTemplate(input) {
    const ownName = String(input?.ownTeam?.name || 'Sua equipe');
    const oppName = String(input?.opponent?.name || 'o adversário');
    const ownOvr = Number(input?.ownTeam?.avgOvr || 50);
    const oppOvr = Number(input?.opponent?.avgOvr || 50);
    const formation = String(input?.ownTeam?.formation || '4-3-3');
    const gap = ownOvr - oppOvr;
    let bucket;
    if (gap >= 10) bucket = MANAGER_ADVICE_TEMPLATES.bigAdvantage;
    else if (gap >= 4) bucket = MANAGER_ADVICE_TEMPLATES.advantage;
    else if (gap > -4) bucket = MANAGER_ADVICE_TEMPLATES.even;
    else if (gap > -10) bucket = MANAGER_ADVICE_TEMPLATES.underdog;
    else bucket = MANAGER_ADVICE_TEMPLATES.bigUnderdog;
    const seed = `${ownName}|${oppName}|${ownOvr}|${oppOvr}|${formation}`;
    const tpl = pickTemplate(bucket, seed);
    return fillTemplate(tpl, { own: ownName, opp: oppName, ownOvr, oppOvr, formation });
}

function buildBoardReactionTemplate(input) {
    const type = String(input?.type || 'default');
    const bucket = BOARD_REACTION_TEMPLATES[type] || BOARD_REACTION_TEMPLATES.default;
    const seed = `${type}|${input?.position ?? ''}|${input?.scoreDiff ?? ''}|${input?.managerStats?.streak ?? ''}`;
    return pickTemplate(bucket, seed);
}

// ============================================================
// LLM PROMPT BUILDERS (used only when bridge is ready)
// ============================================================

function buildPostMatchPrompt(input) {
    return [
        'Você é um cronista esportivo brasileiro. Escreva, em 2-3 frases curtas e em português brasileiro,',
        'uma análise do resultado da partida abaixo. Sem clichês excessivos, sem emojis, sem listas.',
        '',
        `Mandante: ${input?.homeTeam || 'Time A'} (${input?.homeGoals ?? 0} gols)`,
        `Visitante: ${input?.awayTeam || 'Time B'} (${input?.awayGoals ?? 0} gols)`,
        input?.topScorer ? `Destaque: ${input.topScorer}` : '',
        input?.isCup ? 'Competição: Copa eliminatória' : '',
        '',
        'Responda apenas com a análise (sem prefixos, sem aspas).',
    ].filter(Boolean).join('\n');
}

function buildManagerAdvicePrompt(input) {
    return [
        'Você é um auxiliar técnico brasileiro experiente. Em 1-2 frases curtas, em português,',
        'aconselhe o treinador sobre tática e formação para a próxima partida. Sem emojis, sem listas.',
        '',
        `Sua equipe: ${input?.ownTeam?.name || '-'} (OVR médio ${input?.ownTeam?.avgOvr ?? '-'}, formação ${input?.ownTeam?.formation || '-'}, tática ${input?.ownTeam?.currentTactic || '-'})`,
        `Adversário: ${input?.opponent?.name || '-'} (OVR médio ${input?.opponent?.avgOvr ?? '-'})`,
        `Posição atual: ${input?.position ?? '?'} de ${input?.totalTeams ?? '?'}`,
        '',
        'Responda só com o conselho.',
    ].join('\n');
}

function buildBoardReactionPrompt(input) {
    return [
        'Você é o porta-voz da diretoria de um clube de futebol brasileiro. Em 2-3 frases curtas, em português,',
        'emita um comunicado in-character sobre o evento abaixo. Tom formal, sem emojis, sem listas.',
        '',
        `Evento: ${input?.type || 'evento'}`,
        input?.position ? `Posição na tabela: ${input.position}/${input.totalTeams ?? '?'}` : '',
        input?.scoreDiff ? `Diferença de gols: ${input.scoreDiff}` : '',
        input?.managerStats ? `Histórico: ${input.managerStats.wins ?? 0}V ${input.managerStats.losses ?? 0}D` : '',
        '',
        'Responda apenas com o comunicado.',
    ].filter(Boolean).join('\n');
}

// ============================================================
// SERVICE
// ============================================================

export class LLMNarrativeService {
    /**
     * @param {object} opts
     * @param {object} [opts.bridge] — instance with .status() and .decide(prompt). Defaults to null (template-only).
     * @param {number} [opts.timeoutMs=3000]
     * @param {boolean} [opts.enableLLM] — explicit opt-in for real LLM. If omitted,
     *   reads persisted toggle from localStorage (`elifoot_llm_enabled`).
     * @param {boolean} [opts.skipPersistence=false] — disable localStorage reads/writes (for tests).
     */
    constructor(opts = {}) {
        this._bridge = opts.bridge || null;
        this._timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : DEFAULT_TIMEOUT_MS;
        this._skipPersistence = !!opts.skipPersistence;
        // SPEC-174: explicit opt allows test injection; otherwise read from localStorage.
        // Default is OFF (template-only) — user must opt in to download WebLLM model.
        if (typeof opts.enableLLM === 'boolean') {
            this._enableLLM = opts.enableLLM;
        } else if (!this._skipPersistence) {
            this._enableLLM = readPersistedToggle();
        } else {
            this._enableLLM = false;
        }
        this._cache = new Map(); // key → { text, source }
        this._lastMeta = null;
        // SPEC-174: lazy bridge bootstrap state — flips to a Promise while WebLLM
        // module + model are downloading, resolves to the bridge instance.
        this._bridgeBootstrap = null;
    }

    /**
     * @returns {{source: 'webllm'|'template', cached: boolean} | null}
     */
    getLastMeta() {
        return this._lastMeta;
    }

    /**
     * SPEC-174: current state of the user-facing LLM toggle.
     * Templates are ALWAYS available — this flag only controls whether we try
     * to ask the WebLLM bridge before falling back.
     */
    isLLMEnabled() {
        return !!this._enableLLM;
    }

    /**
     * SPEC-174: opt-in to real WebLLM. Persists to localStorage, then lazy-loads
     * the bridge and triggers model download in the background. The download is
     * non-blocking — until it finishes, calls keep falling back to templates.
     *
     * @param {object} [opts]
     * @param {() => Promise<{ AutoPlayLLMBridge: any }>} [opts.bridgeLoader] — test hook
     *   for injecting a mock dynamic import. In prod, defaults to importing
     *   `./AutoPlayLLMBridge.js`.
     * @returns {Promise<{ ok: boolean, status?: string, error?: string }>}
     */
    async enableLLM(opts = {}) {
        this._enableLLM = true;
        if (!this._skipPersistence) writePersistedToggle(true);

        // Already have a ready bridge — nothing to load.
        if (this._bridge && this._isBridgeReady()) {
            return { ok: true, status: 'ready' };
        }
        // Already loading — caller awaits the same promise.
        if (this._bridgeBootstrap) {
            return this._bridgeBootstrap;
        }

        const loader = opts.bridgeLoader || (() => import('./AutoPlayLLMBridge.js'));
        this._bridgeBootstrap = (async () => {
            try {
                const mod = await loader();
                const BridgeCtor = mod.AutoPlayLLMBridge || mod.default;
                if (typeof BridgeCtor !== 'function') {
                    throw new Error('AutoPlayLLMBridge export not found');
                }
                const bridge = new BridgeCtor();
                bridge.setMode('webllm');
                this._bridge = bridge;
                // init() downloads the model — can take seconds. Run it but do not
                // re-throw so the toggle never crashes the caller; status() exposes errors.
                await bridge.init();
                return { ok: true, status: bridge.status().loadStatus };
            } catch (err) {
                this._bridgeBootstrap = null;
                return { ok: false, error: err && err.message ? err.message : String(err) };
            }
        })();
        return this._bridgeBootstrap;
    }

    /**
     * SPEC-174: opt-out. Instant — runtime flag flips, future calls skip the bridge
     * and go straight to templates. The cached bridge (if any) is kept around so a
     * subsequent enableLLM() doesn't re-download the model.
     */
    disableLLM() {
        this._enableLLM = false;
        if (!this._skipPersistence) writePersistedToggle(false);
    }

    /**
     * SPEC-174: bridge bootstrap state, for UI to show "loading…" while WebLLM downloads.
     * @returns {{ enabled: boolean, bridgeReady: boolean, bridgeStatus: object | null }}
     */
    getLLMStatus() {
        let bridgeStatus = null;
        if (this._bridge && typeof this._bridge.status === 'function') {
            try { bridgeStatus = this._bridge.status(); } catch { bridgeStatus = null; }
        }
        return {
            enabled: !!this._enableLLM,
            bridgeReady: this._isBridgeReady(),
            bridgeStatus,
        };
    }

    /**
     * Public sync: builds the template-only narrative immediately (no LLM, no Promise).
     * Useful for callers that need a synchronous value (UI render race-free).
     */
    postMatchAnalysisSync(matchData) {
        return buildPostMatchTemplate(matchData);
    }

    managerAdviceSync(matchCtx) {
        return buildManagerAdviceTemplate(matchCtx);
    }

    boardReactionSync(event) {
        return buildBoardReactionTemplate(event);
    }

    /**
     * Public: post-match analysis (BR-PT, 2-3 sentences).
     */
    async postMatchAnalysis(matchData) {
        const key = `post|${matchData?.homeTeam || ''}|${matchData?.awayTeam || ''}|${matchData?.homeGoals ?? 0}|${matchData?.awayGoals ?? 0}|${matchData?.managerSide || ''}`;
        return this._runWithCache(
            key,
            () => buildPostMatchTemplate(matchData),
            () => buildPostMatchPrompt(matchData)
        );
    }

    /**
     * Public: manager pre-match advice.
     */
    async managerAdvice(matchCtx) {
        const key = `adv|${matchCtx?.ownTeam?.name || ''}|${matchCtx?.opponent?.name || ''}|${matchCtx?.ownTeam?.avgOvr ?? 0}|${matchCtx?.opponent?.avgOvr ?? 0}|${matchCtx?.ownTeam?.formation || ''}`;
        return this._runWithCache(
            key,
            () => buildManagerAdviceTemplate(matchCtx),
            () => buildManagerAdvicePrompt(matchCtx)
        );
    }

    /**
     * Public: board reaction to critical event.
     */
    async boardReaction(event) {
        const key = `brd|${event?.type || 'default'}|${event?.position ?? ''}|${event?.scoreDiff ?? ''}`;
        return this._runWithCache(
            key,
            () => buildBoardReactionTemplate(event),
            () => buildBoardReactionPrompt(event)
        );
    }

    /**
     * Internal: cache → bridge → fallback pipeline.
     * @param {string} cacheKey
     * @param {() => string} buildFallback
     * @param {() => string} buildPrompt
     * @returns {Promise<string>}
     */
    async _runWithCache(cacheKey, buildFallback, buildPrompt) {
        // 1. Cache check
        if (this._cache.has(cacheKey)) {
            const hit = this._cache.get(cacheKey);
            // Move to end (LRU touch)
            this._cache.delete(cacheKey);
            this._cache.set(cacheKey, hit);
            this._lastMeta = { source: hit.source, cached: true };
            return hit.text;
        }

        // 2. Build fallback eagerly — always have something to return
        let fallbackText;
        try {
            fallbackText = buildFallback();
        } catch {
            fallbackText = 'A equipe segue trabalhando. Em breve mais novidades.';
        }
        if (!fallbackText || fallbackText.length < 20) {
            fallbackText = 'A equipe segue trabalhando. Em breve mais novidades sobre a situação.';
        }

        // 3. Try LLM if enabled + bridge ready
        let text = fallbackText;
        let source = 'template';
        if (this._enableLLM && this._bridge && this._isBridgeReady()) {
            try {
                const prompt = buildPrompt();
                const raceResult = await raceWithTimeout(this._bridge.decide(prompt), this._timeoutMs);
                if (raceResult.value && raceResult.value.text && raceResult.value.text.trim().length >= 20) {
                    const candidate = String(raceResult.value.text).trim();
                    // Trim to <=400 chars
                    text = candidate.length > 400 ? candidate.slice(0, 397) + '...' : candidate;
                    source = raceResult.value.source === 'webllm' ? 'webllm' : 'template';
                }
                // If timeout/error/short reply, stay with fallback
            } catch {
                // Swallow — fallback already set
            }
        }

        // 4. Store + LRU evict
        this._cache.set(cacheKey, { text, source });
        if (this._cache.size > CACHE_MAX) {
            const firstKey = this._cache.keys().next().value;
            this._cache.delete(firstKey);
        }
        this._lastMeta = { source, cached: false };
        return text;
    }

    _isBridgeReady() {
        if (!this._bridge || typeof this._bridge.status !== 'function') return false;
        try {
            const s = this._bridge.status();
            return s && s.mode === 'webllm' && s.loadStatus === 'ready';
        } catch {
            return false;
        }
    }
}

/**
 * Module-level singleton (lazy). Engine attaches its own instance under
 * engine.llmNarrative for save-aware lifecycle. Use this only for ad-hoc UI.
 */
let _defaultInstance = null;
export function getDefaultLLMNarrativeService() {
    if (!_defaultInstance) _defaultInstance = new LLMNarrativeService();
    return _defaultInstance;
}

// Expose internals for tests (read-only).
export const __internals = {
    fnv1aHash,
    raceWithTimeout,
    buildPostMatchTemplate,
    buildManagerAdviceTemplate,
    buildBoardReactionTemplate,
    POST_MATCH_TEMPLATES,
    MANAGER_ADVICE_TEMPLATES,
    BOARD_REACTION_TEMPLATES,
    LLM_TOGGLE_STORAGE_KEY,
};
