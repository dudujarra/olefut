/**
 * Save Migrations — funções puras pra migrar saves entre SAVE_VERSION.
 *
 * Princípios:
 * - Cada migration é função pura (input save → output save).
 * - Encadeia automaticamente até targetVersion.
 * - Nunca pula versão. Sempre v(N) → v(N+1).
 *
 * SAVE_VERSION sequence:
 *   2 (atual, BUG-021 fix) → 3 (após v1.0.5 refactor) → 4 (Camada 2)
 *   → 5 (v1.1 Mito) → 6 (v1.1.5 traits) → 7 (v1.2 transição)
 *   → 8 (v1.3 filhos-regens) → 9 (v1.4 rivalidades) → 10 (v1.5 crônica)
 */

/**
 * v2 → v3: refactor v1.0.5 (services structure, sem breaking de dados)
 */
function migrateToV3(save) {
    return {
        ...save,
        schemaVersion: 3,
        services: {
            myth: {},
            relationship: {},
            narrative: {},
            career: {}
        }
    };
}

/**
 * v3 → v4: v1.0.7 Camada 2 — adiciona events array
 */
function migrateToV4(save) {
    return {
        ...save,
        schemaVersion: 4,
        events: save.events || []
    };
}

/**
 * v4 → v5: v1.1 Mito — adiciona myth.halls
 */
function migrateToV5(save) {
    return {
        ...save,
        schemaVersion: 5,
        myth: {
            ...(save.myth || {}),
            halls: save.myth?.halls || {}
        }
    };
}

/**
 * v5 → v6: v1.1.5 traits — adiciona myth.regenInheritance
 */
function migrateToV6(save) {
    return {
        ...save,
        schemaVersion: 6,
        myth: {
            ...save.myth,
            regenInheritance: save.myth?.regenInheritance || {}
        }
    };
}

/**
 * v6 → v7: v1.2 transição — adiciona relations.manager_president
 */
function migrateToV7(save) {
    return {
        ...save,
        schemaVersion: 7,
        relations: {
            ...(save.relations || {}),
            manager_president: save.relations?.manager_president || {
                trust: 60,
                patience: 70
            }
        }
    };
}

/**
 * v7 → v8: v1.3 filhos-regens — adiciona regenLineage
 */
function migrateToV8(save) {
    return {
        ...save,
        schemaVersion: 8,
        regenLineage: save.regenLineage || []
    };
}

/**
 * v8 → v9: v1.4 rivalidades — adiciona relations.club_club
 */
function migrateToV9(save) {
    return {
        ...save,
        schemaVersion: 9,
        relations: {
            ...save.relations,
            club_club: save.relations?.club_club || {}
        }
    };
}

/**
 * v9 → v10: v1.5 crônica — adiciona arcs array completo
 */
function migrateToV10(save) {
    return {
        ...save,
        schemaVersion: 10,
        arcs: save.arcs || []
    };
}

export const migrations = {
    2: migrateToV3,
    3: migrateToV4,
    4: migrateToV5,
    5: migrateToV6,
    6: migrateToV7,
    7: migrateToV8,
    8: migrateToV9,
    9: migrateToV10
};

/**
 * Migrate save até targetVersion encadeando migrations.
 *
 * @param {object} save — save com schemaVersion atual
 * @param {number} targetVersion — versão alvo
 * @returns {object} save migrado
 * @throws Error se schemaVersion ausente OU migration faltando OU targetVersion < current
 */
export function migrate(save, targetVersion) {
    if (!save || typeof save.schemaVersion !== 'number') {
        throw new Error('migrate: save.schemaVersion ausente ou inválido');
    }
    if (targetVersion < save.schemaVersion) {
        throw new Error(`migrate: targetVersion ${targetVersion} < current ${save.schemaVersion}`);
    }
    let current = save;
    while (current.schemaVersion < targetVersion) {
        const fn = migrations[current.schemaVersion];
        if (!fn) {
            throw new Error(`migrate: migration faltando pra v${current.schemaVersion}`);
        }
        current = fn(current);
    }
    return current;
}
