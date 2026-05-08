/**
 * saveSerializer — Serialize/deserialize com prototype restoration genérica.
 *
 * AKITA-RFCT-007: registry-based system pra preservar prototype de class instances.
 * Resolve BUG-021 generalizado.
 *
 * Usage:
 *   import { register, serialize, deserialize } from './saveSerializer';
 *   register('Tournament', Tournament);
 *   register('League', League);
 *   const serialized = serialize(complexObj);
 *   const restored = deserialize(serialized);
 */

const registry = new Map();

/**
 * Register a class so its instances can round-trip.
 *
 * @param {string} typeName — nome único (geralmente class.name)
 * @param {Function} classRef — class constructor
 */
export function register(typeName, classRef) {
    if (registry.has(typeName)) {
        // Re-register OK (idempotent for hot reload)
    }
    registry.set(typeName, classRef);
}

/**
 * Serialize object com tag __class no nível raiz e nested.
 * Walk recursive em arrays + plain objects.
 *
 * @param {*} obj
 * @returns {*} JSON-safe representation
 */
export function serialize(obj) {
    return _walkSerialize(obj, new WeakSet());
}

/**
 * Deserialize com prototype restore baseado em __class.
 *
 * @param {*} data — output of serialize
 * @returns {*} restored value
 */
export function deserialize(data) {
    return _walkDeserialize(data);
}

/**
 * Returns registered types (debug).
 */
export function getRegisteredTypes() {
    return Array.from(registry.keys());
}

/**
 * Clear registry (testing only).
 */
export function _clearRegistry() {
    registry.clear();
}

// ============================================================================
// PRIVATES
// ============================================================================

function _walkSerialize(value, seen) {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;

    // Cycle protection
    if (seen.has(value)) return null;
    seen.add(value);

    if (Array.isArray(value)) {
        return value.map(item => _walkSerialize(item, seen));
    }

    // Map/Set não suportados — skip
    if (value instanceof Map || value instanceof Set) return null;

    // Plain object or class instance
    const out = {};
    const className = value.constructor?.name;
    if (className && className !== 'Object' && registry.has(className)) {
        out.__class = className;
    }

    for (const key of Object.keys(value)) {
        const v = value[key];
        if (typeof v === 'function') continue;
        out[key] = _walkSerialize(v, seen);
    }

    return out;
}

function _walkDeserialize(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;

    if (Array.isArray(value)) {
        return value.map(_walkDeserialize);
    }

    // Plain object
    const className = value.__class;
    let target;
    if (className && registry.has(className)) {
        const ClassConstructor = registry.get(className);
        target = Object.create(ClassConstructor.prototype);
    } else {
        target = {};
    }

    for (const key of Object.keys(value)) {
        if (key === '__class') continue;
        target[key] = _walkDeserialize(value[key]);
    }

    return target;
}
