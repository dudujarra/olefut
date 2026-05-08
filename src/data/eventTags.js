/**
 * EVENT TAGS — Vocabulário FIXO (anti-pattern: livre)
 *
 * SPEC-049 Camada 2. v1.0.7 MVP: 25 tags.
 * Toda escrita de evento DEVE usar tags desta lista.
 */

export const EVENT_TAGS = Object.freeze({
    // Tom moral
    TRAICAO: 'traicao',
    LEALDADE: 'lealdade',
    REDENCAO: 'redencao',
    VINGANCA: 'vinganca',
    MILAGRE: 'milagre',
    VERGONHA: 'vergonha',
    EPICO: 'epico',
    POLEMICA: 'polemica',
    ARBITRAGEM: 'arbitragem',

    // Contexto rivalidade
    RIVAL_DIRETO: 'rival_direto',
    CLASSICO_ESTADUAL: 'classico_estadual',
    CLASSICO_REGIONAL: 'classico_regional',
    CLASSICO_NACIONAL: 'classico_nacional',

    // Categoria do ator
    IDOLO: 'idolo',
    TRAIDOR: 'traidor',
    CRIA_DA_BASE: 'cria_da_base',
    VETERANO: 'veterano',
    JOVEM: 'jovem',

    // Pressão/momentum
    PRESSAO: 'pressao',
    ALIVIO: 'alivio',
    SURPRESA: 'surpresa',

    // Stakes/contexto
    TITULO: 'titulo',
    REBAIXAMENTO: 'rebaixamento',
    LIBERTADORES: 'libertadores',

    // Mídia
    IMPRENSA: 'imprensa',
    MIDIATICO: 'midiatico'
});

export const ALL_EVENT_TAGS = Object.values(EVENT_TAGS);

/**
 * Validate that a tag is in the fixed vocabulary.
 */
export function isValidEventTag(tag) {
    return ALL_EVENT_TAGS.includes(tag);
}

/**
 * Validate array of tags. Throws in dev if any invalid.
 */
export function validateTags(tags) {
    if (!Array.isArray(tags)) return false;
    return tags.every(isValidEventTag);
}
