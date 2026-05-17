import { EngineLogger } from './EngineLogger.js';
/**
 * ModLoader — SPEC-C4
 *
 * Carrega cartas custom via JSON validado pra modders BR.
 *
 * Uso:
 *   const result = ModLoader.load(jsonText);
 *   result.valid    // Array de cards validados (id sempre mod_*)
 *   result.errors   // Array de issues (cardId, field, message)
 *
 * Pure module. Headless.
 */

const EFFECT_WHITELIST = new Set([
    'moralDelta', 'energyDelta', 'tacticShift',
    'stress', 'boss', 'fans', 'teammates', 'sponsors',
    'bossSuccess', 'bossFailure', 'fansSuccess', 'fansFailure',
]);

const VALID_TIERS = new Set(['common', 'uncommon', 'rare', 'legendary']);
const SCRIPT_PATTERN = /<\s*(script|iframe|object|embed)\b/i;
const HTML_TAGS = /<\/?[a-z][^>]*>/gi;
const MAX_NUMERIC = 20;

/**
 * Sanitiza texto: remove tags HTML, retorna null se contém scripts.
 */
function sanitizeText(s) {
    if (typeof s !== 'string') return null;
    if (SCRIPT_PATTERN.test(s)) return null;
    return s.replace(HTML_TAGS, '').trim();
}

/**
 * Sanitiza effect object via whitelist + clamp.
 */
function sanitizeEffect(eff) {
    if (!eff || typeof eff !== 'object') return {};
    const clean = {};
    for (const key of Object.keys(eff)) {
        if (!EFFECT_WHITELIST.has(key)) continue;
        const v = eff[key];
        if (typeof v === 'number') {
            clean[key] = Math.max(-MAX_NUMERIC, Math.min(MAX_NUMERIC, v));
        } else if (typeof v === 'string') {
            // tacticShift fica como string
            clean[key] = v.slice(0, 32);
        }
    }
    return clean;
}

/**
 * Valida uma carta individual. Retorna { valid: cleanCard|null, errors: [] }.
 */
function validateCard(raw, idx) {
    const errors = [];

    if (!raw || typeof raw !== 'object') {
        errors.push({ cardId: `index_${idx}`, field: 'root', message: 'Carta não é objeto válido' });
        return { valid: null, errors };
    }

    // ID — força prefix mod_
    let id = typeof raw.id === 'string' ? raw.id.trim() : '';
    if (!id) {
        errors.push({ cardId: `index_${idx}`, field: 'id', message: 'ID ausente' });
        return { valid: null, errors };
    }
    if (!id.startsWith('mod_')) id = 'mod_' + id;

    // Text
    const text = sanitizeText(raw.text);
    if (!text) {
        errors.push({ cardId: id, field: 'text', message: 'Texto ausente ou contém script' });
        return { valid: null, errors };
    }

    // Options
    if (!Array.isArray(raw.options) || raw.options.length < 2 || raw.options.length > 5) {
        errors.push({ cardId: id, field: 'options', message: 'Carta deve ter 2-5 opções' });
        return { valid: null, errors };
    }

    const cleanOptions = [];
    for (let i = 0; i < raw.options.length; i++) {
        const opt = raw.options[i];
        if (!opt || typeof opt !== 'object') {
            errors.push({ cardId: id, field: `options[${i}]`, message: 'Opção inválida' });
            continue;
        }
        const label = sanitizeText(opt.label);
        const resultText = sanitizeText(opt.resultText);
        if (!label || !resultText) {
            errors.push({ cardId: id, field: `options[${i}].label/resultText`, message: 'Label ou resultText ausente/inválido' });
            continue;
        }
        cleanOptions.push({
            label,
            effect: sanitizeEffect(opt.effect),
            resultText,
        });
    }

    if (cleanOptions.length < 2) {
        errors.push({ cardId: id, field: 'options', message: 'Menos de 2 opções válidas após validação' });
        return { valid: null, errors };
    }

    // Tier opcional
    const tier = VALID_TIERS.has(raw.tier) ? raw.tier : 'common';
    const minuteRange = Array.isArray(raw.minuteRange) && raw.minuteRange.length === 2 ? raw.minuteRange : [15, 90];
    const derby = !!raw.derby;
    const reactiveType = typeof raw.reactiveType === 'string' ? raw.reactiveType : null;

    return {
        valid: {
            id,
            text,
            options: cleanOptions,
            tier,
            minuteRange,
            derby,
            reactiveType,
            _modSource: 'mod',
        },
        errors,
    };
}

/**
 * Loader principal. Aceita string JSON ou objeto já parsed.
 *
 * @param {string|object} input
 * @returns {{ valid: Array, errors: Array, deck?: string }}
 */
export function load(input) {
    let parsed;
    if (typeof input === 'string') {
        try {
            parsed = JSON.parse(input);
        } catch (e) {
            return { valid: [], errors: [{ field: 'json', message: `JSON inválido: ${e.message}` }] };
        }
    } else if (input && typeof input === 'object') {
        parsed = input;
    } else {
        return { valid: [], errors: [{ field: 'root', message: 'Input deve ser string JSON ou objeto' }] };
    }

    const cards = Array.isArray(parsed.cards) ? parsed.cards : null;
    if (!cards) {
        return { valid: [], errors: [{ field: 'cards', message: 'Campo "cards" ausente ou não é array' }] };
    }

    const allErrors = [];
    const validCards = [];
    const seenIds = new Set();

    cards.forEach((c, idx) => {
        const result = validateCard(c, idx);
        result.errors.forEach(e => allErrors.push(e));
        if (result.valid) {
            if (seenIds.has(result.valid.id)) {
                allErrors.push({ cardId: result.valid.id, field: 'id', message: 'ID duplicado no batch' });
            } else {
                seenIds.add(result.valid.id);
                validCards.push(result.valid);
            }
        }
    });

    return {
        valid: validCards,
        errors: allErrors,
        deck: typeof parsed.deck === 'string' ? parsed.deck : undefined,
    };
}

/**
 * Merge cards mod com deck builtin. Cards mod ficam ao final.
 *
 * @param {Array} builtinDeck
 * @param {Array} modCards
 * @returns {Array}
 */
export function mergeWithDeck(builtinDeck, modCards) {
    if (!Array.isArray(builtinDeck)) return [];
    if (!Array.isArray(modCards) || modCards.length === 0) return builtinDeck;
    return [...builtinDeck, ...modCards];
}

export { EFFECT_WHITELIST, VALID_TIERS, MAX_NUMERIC };
