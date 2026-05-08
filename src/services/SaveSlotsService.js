/**
 * SaveSlotsService — SPEC-074 Sprint N
 *
 * 3 save slots persistent + export/import JSON.
 */

const SLOT_KEYS = ['elifoot_save_slot1', 'elifoot_save_slot2', 'elifoot_save_slot3'];
const META_KEY = 'elifoot_save_meta';

export function listSaveSlots() {
    const meta = readMeta();
    return SLOT_KEYS.map((key, i) => {
        const raw = safeGet(key);
        if (!raw) return { slot: i + 1, empty: true };
        try {
            const data = JSON.parse(raw);
            const m = meta[i] || {};
            return {
                slot: i + 1,
                empty: false,
                managerName: data.gameState?.manager || m.managerName || 'Unknown',
                teamName: m.teamName || 'Unknown',
                week: data.gameState?.engineState?.currentWeek || m.week || 0,
                seasonNumber: data.gameState?.engineState?.seasonNumber || m.seasonNumber || 1,
                savedAt: m.savedAt || new Date().toISOString(),
                size: raw.length
            };
        } catch {
            return { slot: i + 1, empty: true, corrupted: true };
        }
    });
}

export function saveToSlot(slotNum, gameState, engine) {
    if (slotNum < 1 || slotNum > 3) return false;
    const key = SLOT_KEYS[slotNum - 1];
    try {
        const payload = {
            gameState,
            engineState: serializeEngine(engine),
            savedAt: new Date().toISOString(),
            saveVersion: 5
        };
        const json = JSON.stringify(payload);
        localStorage.setItem(key, json);

        // Update meta
        const meta = readMeta();
        meta[slotNum - 1] = {
            managerName: gameState.manager,
            teamName: engine?.getTeam?.(gameState.teamId)?.name || 'Unknown',
            week: engine?.currentWeek || 0,
            seasonNumber: engine?.seasonNumber || 1,
            savedAt: payload.savedAt
        };
        localStorage.setItem(META_KEY, JSON.stringify(meta));
        return true;
    } catch {
        return false;
    }
}

export function loadFromSlot(slotNum) {
    if (slotNum < 1 || slotNum > 3) return null;
    const key = SLOT_KEYS[slotNum - 1];
    const raw = safeGet(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function deleteSlot(slotNum) {
    if (slotNum < 1 || slotNum > 3) return false;
    try {
        localStorage.removeItem(SLOT_KEYS[slotNum - 1]);
        const meta = readMeta();
        delete meta[slotNum - 1];
        localStorage.setItem(META_KEY, JSON.stringify(meta));
        return true;
    } catch {
        return false;
    }
}

export function exportSlotJSON(slotNum) {
    const data = loadFromSlot(slotNum);
    if (!data) return null;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elifoot-save-slot${slotNum}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
}

export function importJSONToSlot(slotNum, file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const data = JSON.parse(text);
                if (!data.saveVersion || data.saveVersion < 5) {
                    resolve({ success: false, msg: 'Save version incompatível' });
                    return;
                }
                localStorage.setItem(SLOT_KEYS[slotNum - 1], JSON.stringify(data));
                resolve({ success: true, msg: 'Save importado' });
            } catch (err) {
                resolve({ success: false, msg: 'JSON inválido: ' + err.message });
            }
        };
        reader.onerror = () => resolve({ success: false, msg: 'Erro lendo arquivo' });
        reader.readAsText(file);
    });
}

function safeGet(key) {
    try { return localStorage.getItem(key); }
    catch { return null; }
}

function readMeta() {
    try {
        const raw = localStorage.getItem(META_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function serializeEngine(engine) {
    if (!engine) return null;
    return {
        currentWeek: engine.currentWeek,
        seasonNumber: engine.seasonNumber,
        balance: engine.balance,
        manager: engine.manager,
        teamId: engine.manager?.teamId
        // Note: full engine serialization handled by existing saveToStorage
    };
}
