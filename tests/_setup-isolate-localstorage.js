// AKITA-105: garantir isolamento de localStorage entre suites de teste.
//
// Vitest é configurado com `--localstorage-file=./.vitest-localstorage`
// (Node 22 warning suppression + API completa). Sem este setup, dados
// persistem entre suites e quebram testes order-dependent (autoplay-full-audit,
// SPEC-009, MARL e2e, golden master).
//
// Cada arquivo de teste começa com localStorage limpo.

import { beforeAll } from 'vitest';

beforeAll(() => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
        localStorage.clear();
    }
});
