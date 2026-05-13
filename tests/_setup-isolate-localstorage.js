// AKITA-105+367: garantir isolamento de localStorage entre suites de teste.
//
// Histórico: vitest usava `--localstorage-file=./.vitest-localstorage` (Node 22
// native localStorage file-backed) + `localStorage.clear()` em beforeAll. Mas
// CI ubuntu mostra comportamento diferente do macOS dev — file persiste com
// stale state entre test files, quebrando isolamento (SPEC-181, SPEC-F5*,
// v2-gaps-smoke).
//
// Fix definitivo: substituir localStorage por shim in-memory determinístico.
// Sem file backing, sem latência de flush, sem cross-suite leak. Limpo em
// beforeAll de cada test file via clear().
//
// Pre-test setup (executes BEFORE imports do test file)

import { beforeAll } from 'vitest';

class InMemoryStorage {
    constructor() {
        this._data = new Map();
    }
    get length() {
        return this._data.size;
    }
    key(index) {
        return Array.from(this._data.keys())[index] ?? null;
    }
    getItem(key) {
        return this._data.has(String(key)) ? this._data.get(String(key)) : null;
    }
    setItem(key, value) {
        this._data.set(String(key), String(value));
    }
    removeItem(key) {
        this._data.delete(String(key));
    }
    clear() {
        this._data.clear();
    }
}

// Replace global localStorage if Node 22 native or absent — guarantees behavior parity
// across dev (macOS) and CI (ubuntu). Native localStorage file-backed has flush
// timing issues that break isolated tests.
const memStorage = new InMemoryStorage();
Object.defineProperty(globalThis, 'localStorage', {
    value: memStorage,
    writable: true,
    configurable: true,
});

beforeAll(() => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
        localStorage.clear();
    }
});
