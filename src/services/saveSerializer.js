/**
 * saveSerializer — Serialize/deserialize com prototype restoration genérica.
 *
 * Status: SKELETON (preenchido em AKITA-RFCT-007)
 *
 * Resolve BUG-021 generalizado: registry de tipos pra preservar prototype
 * de class instances após JSON round-trip.
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
        console.warn(`[saveSerializer] re-registering "${typeName}"`);
    }
    registry.set(typeName, classRef);
}

/**
 * @placeholder AKITA-RFCT-007
 * Serialize obj com tag __class no nível raiz e nested.
 */
export function serialize(obj) {
    // To be implemented (deep walk + tag instances)
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @placeholder AKITA-RFCT-007
 * Deserialize com prototype restore baseado em __class.
 */
export function deserialize(data) {
    // To be implemented (deep walk + Object.create + property copy)
    return data;
}

/**
 * Returns registered types (debug).
 */
export function getRegisteredTypes() {
    return Array.from(registry.keys());
}
