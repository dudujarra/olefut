/**
 * OnboardingTriggers — SPEC-F5.1
 *
 * Sistema progressivo de tutoriais contextuais por mecânica.
 * Cada view tem um tooltip set; primeira abertura dispara overlay.
 *
 * Pure module + localStorage seen tracking.
 */

const STORAGE_PREFIX = 'elifoot_onboarding_seen_';

export const ONBOARDING_BY_VIEW = {
    market: {
        title: 'MERCADO',
        steps: [
            'Aqui você lista ofertas de transferência. Cada oferta tem prazo.',
            'Use FILTROS para achar jogador certo. Compare OVR e contratos.',
            'Negociação: contraproposta vai e volta. Decida com cuidado.',
        ],
    },
    squad: {
        title: 'PLANTEL',
        steps: [
            'Esta é sua equipe. Titulares aparecem em destaque.',
            'Clique pra ver detalhes do jogador (atributos, contrato, lesão).',
            'Pode promover juvenis, emprestar reservas, ou vender.',
        ],
    },
    standings: {
        title: 'TABELA',
        steps: [
            'Classificação da sua divisão.',
            'Cores indicam zonas: Libertadores, Sul-Americana, rebaixamento.',
            'Acompanhe rivais diretos e ajuste objetivo da temporada.',
        ],
    },
    achievements: {
        title: 'CONQUISTAS',
        steps: [
            'Troféus e marcas históricas.',
            'Cada conquista desbloqueia narrativa + cosmético.',
            'Foco em campeonatos te dá direção clara.',
        ],
    },
    press: {
        title: 'COLETIVA',
        steps: [
            'Aqui você responde a imprensa após eventos críticos.',
            'Respostas afetam moral do elenco e diretoria.',
            'Cuidado com declarações: imprensa lembra.',
        ],
    },
    chronicle: {
        title: 'CRÔNICA',
        steps: [
            'História do seu save. Texto gerado por temporada.',
            'Cada temp tem mood (triunfo / tragédia / equilíbrio).',
            'Exportável como PNG. Mostre pros amigos.',
        ],
    },
    rivalries: {
        title: 'RIVALIDADES',
        steps: [
            'Clássicos que você viveu. H2H tracked por save.',
            'Após 3 jogos vs mesmo time, vira rivalidade ativa.',
            'Cartas especiais aparecem em derby.',
        ],
    },
    lineage: {
        title: 'LINHAGEM',
        steps: [
            'Lendas do clube + traits herdados.',
            'Jogadores aposentados podem virar treinador/scout em outro save.',
            'Tradição do clube cresce save a save.',
        ],
    },
};

/**
 * Verifica se view tem onboarding pendente.
 *
 * @param {string} viewId
 * @returns {boolean}
 */
export function hasOnboardingPending(viewId) {
    if (!ONBOARDING_BY_VIEW[viewId]) return false;
    if (typeof localStorage === 'undefined') return false;
    try {
        return localStorage.getItem(STORAGE_PREFIX + viewId) !== 'true';
    } catch {
        return false;
    }
}

/**
 * Retorna content de onboarding pra view.
 *
 * @param {string} viewId
 * @returns {{ title, steps } | null}
 */
export function getOnboardingForView(viewId) {
    return ONBOARDING_BY_VIEW[viewId] || null;
}

/**
 * Marca onboarding de view como visto.
 *
 * @param {string} viewId
 */
export function markOnboardingSeen(viewId) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_PREFIX + viewId, 'true');
    } catch { /* noop */ }
}

/**
 * Reset todos onboardings (replay tutorial — SPEC-F5.3).
 */
export function resetAllOnboarding() {
    if (typeof localStorage === 'undefined') return;
    try {
        Object.keys(ONBOARDING_BY_VIEW).forEach(viewId => {
            localStorage.removeItem(STORAGE_PREFIX + viewId);
        });
        // also reset main onboarding
        localStorage.removeItem('elifoot_onboarding_done');
        localStorage.removeItem('elifoot_onboarding_step');
    } catch { /* noop */ }
}

/**
 * Lista views com onboarding já visto.
 *
 * @returns {Array<string>}
 */
export function getSeenViews() {
    if (typeof localStorage === 'undefined') return [];
    const seen = [];
    try {
        Object.keys(ONBOARDING_BY_VIEW).forEach(viewId => {
            if (localStorage.getItem(STORAGE_PREFIX + viewId) === 'true') {
                seen.push(viewId);
            }
        });
    } catch { /* noop */ }
    return seen;
}

export { STORAGE_PREFIX };
