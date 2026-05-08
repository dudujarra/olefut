// P1-6: Sound effects via Web Audio API (sem assets externos)
// Toggle: localStorage 'elifoot_sound' = '1' (default ON)

let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) audioCtx = new Ctx();
        } catch { return null; }
    }
    return audioCtx;
}

export function isSoundEnabled() {
    try {
        const v = localStorage.getItem('elifoot_sound');
        return v === null || v === '1';
    } catch { return true; }
}

export function setSoundEnabled(enabled) {
    try {
        localStorage.setItem('elifoot_sound', enabled ? '1' : '0');
    } catch { /* ignore */ }
}

function tone(freq, duration, type = 'sine', volume = 0.15) {
    if (!isSoundEnabled()) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch { /* ignore */ }
}

// Public sound effects
export const sfx = {
    goal() {
        // Crowd-cheer-like: rising arpeggio
        if (!isSoundEnabled()) return;
        tone(523, 0.15, 'sine', 0.18); // C5
        setTimeout(() => tone(659, 0.15, 'sine', 0.18), 80); // E5
        setTimeout(() => tone(784, 0.3, 'sine', 0.2), 160); // G5
    },
    card() {
        tone(220, 0.2, 'square', 0.1); // low buzz
    },
    whistle() {
        tone(2000, 0.1, 'sine', 0.15);
        setTimeout(() => tone(2000, 0.1, 'sine', 0.15), 120);
    },
    click() {
        tone(800, 0.05, 'sine', 0.08);
    },
    success() {
        tone(523, 0.1, 'sine', 0.15);
        setTimeout(() => tone(784, 0.15, 'sine', 0.15), 100);
    },
    fail() {
        tone(220, 0.2, 'sawtooth', 0.12);
    }
};
