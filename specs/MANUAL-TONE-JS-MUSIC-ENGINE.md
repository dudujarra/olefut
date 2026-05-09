# ELIFOOT Music Engine: House Music Profissional em Tone.js

> **Manual técnico oficial do sistema musical ELIFOOT.**
> Fonte de verdade para AKITA-100+ (audio system).
> Aprovado por Dudu em 2026-05-08.

## TL;DR

**Arquitetura híbrida 3 camadas:**
1. Stems pré-renderizados via `Tone.Offline()` em build/CI (~72 tracks WAV/OGG, seeds Mulberry32)
2. **MusicDirector runtime** com vertical layering (`Tone.Player + Tone.Gain` por stem) + horizontal re-sequencing quantizado em barras (`Tone.Transport.scheduleOnce` em `'@1m'`)
3. **Camadas procedurais ao vivo** (stingers, risers, FX) sintetizadas em tempo real com `MembraneSynth/NoiseSynth/MonoSynth`

**Som "club-quality" = 3 decisões DSP não-negociáveis:**
1. Kicks 909/808 layered (corpo senoidal + click filtrado + saturação Chebyshev ímpar)
2. **Sidechain real** via `Tone.Follower → Tone.Gain` (NÃO LFO fake)
3. **Mastering chain glue:** EQ3 → MultibandCompressor 3-band → Limiter -0.3 dBTP

**Groove:** `Transport.swing = 0.16-0.22` (54-58% MPC), `PolySynth maxPolyphony: 4-6`.

**MatchEngine → MusicDirector via event bus desacoplado** (Game Programming Patterns / Event Queue). Subgêneros (Deep/Tech/Progressive/Funky/Ambient/Tribal/Acid/Disco) = 4-6 stems pre-rendered mesma key/BPM. Transições `'@1m'`. RTPC contínuos: momentum, scoreDiff, timeRemaining → filter cutoff, volumes, stinger probability. Seeds = `matchId + minute`.

---

## Key Findings

1. **Tone.Offline = chave para 72+ tracks.** OfflineAudioContext, retorna `ToneAudioBuffer`. Samples pré-carregados FORA callback (issue #368). Durações >120s = artefatos (issue #551) — chunks de 32 bars + concatene.

2. **Vertical layering + horizontal re-sequencing = canônico Wwise/FMOD.** Transição SEMPRE quantizada à próxima barra. Crossfade equal-power 1-2 bars via `Tone.CrossFade` ou pares `Tone.Gain` curva cosine.

3. **Sidechain real exige `Tone.Follower` + inversão**, NÃO `Tone.Compressor` (Web Audio `DynamicsCompressorNode` não tem sidechain key — limitação spec). Padrão: `kickBus → Follower → WaveShaper(invert+offset) → Gain.gain`. Alt: ghost-kick LFO sincronizado.

4. **TR-909 kick autêntico = 3 camadas paralelas:**
   - (a) `OmniOscillator` triangle saturado (Chebyshev order 3-5) + `FrequencyEnvelope` 150Hz→50Hz em 30-50ms
   - (b) Burst noise bandpass 2-4kHz com env 5-10ms (click)
   - (c) Opcional sub puro senoidal
   - **`Tone.MembraneSynth` puro NÃO faz isso direito.**

5. **TB-303 acid bass autêntico:**
   - Saw OU square (alternar via switch)
   - Filtro lowpass 18dB/oct (`rolloff: -24`)
   - `FrequencyEnvelope` rápido modulando cutoff
   - Slide via portamento (`portamento: 0.05`)
   - Accent = boost simultâneo velocity + env mod + Q
   - Distortion APÓS filter (essencial)

6. **Performance limites duros:** ≤24 vozes simultâneas. Polifonia ≤6 PolySynth. Pool e reuse (NUNCA criar/destruir runtime). NUNCA alocar dentro `scheduleRepeat`. Budget render quantum ~2.67ms @ 48kHz.

7. **Swing MPC:** `Tone.Transport.swing = 0.16` (~54%) com `swingSubdivision = '16n'`. Funky house: 0.18-0.22. Tech house Carl Cox: 0.05-0.10.

8. **Chord palettes (fixos):**
   - Deep: i7-iv7-VII7-III7 + 9/11/13 (Larry Heard)
   - Tech: i-bVII Phrygian (Carl Cox)
   - Progressive: i-bVI-bIII-bVII (Solomun) ou i-v-bVI-bVII (Anyma)
   - Funky: ii7-V7-Imaj7 (MK)
   - Acid: single root pedal
   - Afro: i-bVII-bVI-bVII (Black Coffee)
   - Disco/French: I-vi-ii-V

---

## 1. ARQUITETURA HÍBRIDA

### 1.1 Visão geral

```
┌──────────────────────────────────────────────────────────────────┐
│                        BUILD-TIME (Node.js)                       │
│  trackManifest.ts ──► Tone.Offline() batch ──► stems/*.ogg       │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ deploy
┌────────────────────────────────▼─────────────────────────────────┐
│                          RUNTIME (Browser)                        │
│  MatchEngine ──events──► MusicDirector ──audio──► Master Bus      │
│                          (FSM + RTPC)                             │
│            ▼              ▼              ▼          ▼             │
│      StemPlayers     ProcSynths     Stingers    Mastering        │
│      (pool ×N)       (909/303/Pad)  (noise)                       │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Pipeline pré-render offline

```typescript
export interface TrackSeed {
  id: string;
  subgenre: 'deep'|'tech'|'progressive'|'funky'|'ambient'|'tribal'|'acid'|'disco';
  bpm: number;
  key: string;
  mode: 'minor'|'major'|'phrygian'|'mixolydian'|'dorian';
  length: number;                // bars (32-64)
  energyCurve: number[];         // 8 valores 0-1
  stems: ('drums'|'bass'|'harmony'|'melody'|'fx'|'perc')[];
  rngSeed: number;
}

export function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function renderTrack(seed: TrackSeed): Promise<void> {
  const rng = mulberry32(seed.rngSeed);
  const totalSec = seed.length * (60 / seed.bpm) * 4;

  for (const stemName of seed.stems) {
    const buffer = await Tone.Offline(({ transport }) => {
      transport.bpm.value = seed.bpm;
      transport.swing = swingForSubgenre(seed.subgenre);
      transport.swingSubdivision = '16n';
      const stemBus = new Tone.Channel({ volume: 0 }).toDestination();
      buildStem(stemName, seed, rng, stemBus, transport);
      transport.start(0);
    }, totalSec, 2, 44100);

    const wav = await encodeWAV({
      sampleRate: 44100,
      channelData: [buffer.getChannelData(0), buffer.getChannelData(1)],
    });
    await fs.writeFile(`stems/${seed.id}_${stemName}.wav`, Buffer.from(wav));
  }
}
```

**Crítico:**
- Renderize STEMS SEPARADOS (NUNCA mix completo) — vertical layering exige
- Chunk se `totalSec > 60s` (32 bars + 1 bar overlap)
- Samples pré-carregados ANTES do callback (issue #368)

### 1.3 MusicDirector runtime

```typescript
type GameEvent =
  | { type: 'MATCH_START'; matchId: string; importance: 'routine'|'derby'|'final' }
  | { type: 'GOAL_SCORED'; team: 'home'|'away'; minute: number }
  | { type: 'POSSESSION'; ratio: number }
  | { type: 'MOMENTUM'; value: number }              // -1..+1
  | { type: 'TIME_REMAINING'; seconds: number }
  | { type: 'SCORE_DIFF'; diff: number }
  | { type: 'STATE_CHANGE'; to: 'pre'|'live'|'post'|'dashboard' }
  | { type: 'CARD'; severity: 'yellow'|'red' };

class MusicDirector {
  private state: 'pre'|'live'|'post'|'dashboard' = 'dashboard';
  private currentStems: StemSet | null = null;

  // Buses — sidechain só ataca bass+harmony, NÃO drums
  private drumBus = new Tone.Channel().connect(this.masterBus);
  private bassBus = new Tone.Channel().connect(this.sidechainGain).connect(this.masterBus);
  private harmonyBus = new Tone.Channel().connect(this.sidechainGain).connect(this.masterBus);
  private melodyBus = new Tone.Channel().connect(this.masterBus);

  private rtpc = {
    momentum: 0, intensity: 0.5, scoreDiff: 0, timeRemaining: 90,
    importance: 'routine' as const,
  };

  private masterFilter = new Tone.Filter({ frequency: 22000, type: 'lowpass', Q: 0.7 });

  private async transitionTo(newState: typeof this.state) {
    const targetSubgenre = this.subgenreFor(newState);
    const next = await this.stemLibrary.load(this.pickTrack(targetSubgenre));

    const transitionTime = Tone.getTransport().nextSubdivision('1m');

    if (this.currentStems) {
      this.crossfadeStems(this.currentStems, next, transitionTime, '2m');
    } else {
      this.startStems(next, transitionTime);
    }
  }

  private crossfadeStems(from, to, startTime, duration) {
    const dur = Tone.Time(duration).toSeconds();
    [
      [from.drums.volume, to.drums.volume],
      [from.bass.volume, to.bass.volume],
      [from.harmony.volume, to.harmony.volume],
      [from.melody.volume, to.melody.volume],
    ].forEach(([fromVol, toVol]) => {
      fromVol.setValueAtTime(0, startTime);
      fromVol.linearRampToValueAtTime(-60, startTime + dur);
      toVol.setValueAtTime(-60, startTime);
      toVol.linearRampToValueAtTime(0, startTime + dur);
    });
    Object.values(to).forEach((p: Tone.Player) => p.sync().start(startTime));
  }

  private onGoal(e) {
    this.fireGoalStinger(e.team);
    const t = Tone.getTransport().nextSubdivision('1m');
    if (this.currentStems?.melody) {
      this.currentStems.melody.volume.setValueAtTime(-12, t);
      this.currentStems.melody.volume.linearRampToValueAtTime(0, t + 0.5);
      Tone.getTransport().scheduleOnce((time) => {
        this.currentStems?.melody.volume.linearRampToValueAtTime(-12, time + 1);
      }, t + 8 * Tone.Time('1m').toSeconds());
    }
  }

  private onMomentum(e) {
    this.rtpc.momentum = e.value;
    const cutoff = this.mapMomentumToCutoff(e.value); // 800Hz @ -1, 22000Hz @ +1
    this.masterFilter.frequency.rampTo(cutoff, 2);
    this.harmonyBus.volume.rampTo(e.value > 0 ? -2 : -10, 2);
  }
}
```

### 1.4 Crossfade equal-power

2 bars padrão profissional pra house. Stingers = 50ms attack/release linear.

### 1.5 Memory management

- Pool fixo 6-8 `Tone.Player`, swap via `player.buffer = newBuffer`
- `PolySynth({ maxPolyphony: 4 })` explícito
- 1 reverb por bus (NUNCA por instrumento)
- AudioBuffer reuse via `Map<string, ToneAudioBuffer>` global
- Pré-aloque arrays em `scheduleRepeat`

---

## 2. DSP & SYNTHESIS

### 2.1 TR-909 Kick (production-ready)

```typescript
class Kick909 {
  constructor(destination: Tone.InputNode) {
    // BODY: triangle 50Hz + pitch env 150→50Hz em 30ms + Chebyshev 3
    this.body = new Tone.Oscillator({ type: 'triangle', frequency: 50 }).start();
    this.pitchEnv = new Tone.FrequencyEnvelope({
      attack: 0.001, decay: 0.03, sustain: 0, release: 0.001,
      baseFrequency: 50, octaves: 1.6, exponent: 2.5,
    });
    this.pitchEnv.connect(this.body.frequency);

    this.saturator = new Tone.Chebyshev(3);
    this.bodyEnv = new Tone.AmplitudeEnvelope({
      attack: 0.001, decay: 0.45, sustain: 0, release: 0.05,
      attackCurve: 'exponential', releaseCurve: 'exponential',
    });
    this.body.chain(this.saturator, this.bodyEnv, this.out);

    // CLICK: white noise bandpass 3kHz Q=1.2 + env 5-10ms
    this.clickNoise = new Tone.Noise('white').start();
    this.clickFilter = new Tone.Filter({ type: 'bandpass', frequency: 3000, Q: 1.2 });
    this.clickEnv = new Tone.AmplitudeEnvelope({
      attack: 0.0005, decay: 0.008, sustain: 0, release: 0.005,
    });
    this.clickNoise.chain(this.clickFilter, this.clickEnv, new Tone.Gain(0.4), this.out);
  }

  trigger(time, velocity = 1) {
    this.pitchEnv.triggerAttackRelease(0.05, time);
    this.bodyEnv.triggerAttackRelease(0.3, time, velocity);
    this.clickEnv.triggerAttackRelease(0.01, time, velocity * 0.8);
  }
}
```

### 2.2 TR-808 Kick

Sine + pitch sweep curto + decay 1s. Saturação MUITO sutil (Chebyshev ordem 2, wet 0.15).

### 2.3 TR-909 Snare

2 layers paralelos:
- **Tonal:** 2× triangle 200Hz + 330Hz, env decay 0.1s
- **Noise:** white → highpass 1.5kHz Q=0.7, env decay 0.18s

### 2.4 TR-909 Hi-hats com choke

Noise → bandpass 8kHz → highshelf +6dB @ 6kHz → env. Closed: decay 0.04. Open: decay 0.4. **Choke:** `metalEnv.cancel(time)` antes de retrigger.

### 2.5 TB-303 Acid Bass

```typescript
class Acid303 {
  private synth: Tone.MonoSynth;
  private dist: Tone.Distortion;
  private lastNote: string | null = null;

  constructor(destination) {
    this.synth = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.05 },
      filterEnvelope: {
        attack: 0.001, decay: 0.2, sustain: 0, release: 0.1,
        baseFrequency: 200, octaves: 4, exponent: 2,
      },
      filter: { type: 'lowpass', rolloff: -24, Q: 8 },
      portamento: 0,
    });
    this.dist = new Tone.Distortion({ distortion: 0.4, oversample: '2x' });
    this.synth.chain(this.dist, destination);
  }

  playStep(note, time, dur, accent: boolean, slide: boolean) {
    if (slide && this.lastNote) {
      this.synth.portamento = 0.06;
      this.synth.setNote(note, time);
      // NÃO retrigger envelope — slide preserva env
    } else {
      this.synth.portamento = 0;
      if (accent) {
        this.synth.filter.Q.setValueAtTime(14, time);
        this.synth.filterEnvelope.octaves = 5.5;
      } else {
        this.synth.filter.Q.setValueAtTime(8, time);
        this.synth.filterEnvelope.octaves = 4;
      }
      this.synth.triggerAttackRelease(note, dur, time, accent ? 1.0 : 0.7);
    }
    this.lastNote = note;
  }
}
```

**Detalhe:** slide NÃO retriggera envelope. Use `setNote()` em vez de `triggerAttack()`.

### 2.6 Reese / Sub / Pluck bass

- **Reese:** `fatsawtooth count: 3, spread: 30` + Chorus 0.5Hz depth 0.3
- **Sub:** `MonoSynth sine + Distortion 0.08 wet 0.3 + portamento 0.02`
- **Pluck:** `MonoSynth saw + filterEnv decay 0.08 + filter rolloff: -24, Q: 3`

### 2.7 Pads / Stab / Lead

- **Pad:** `PolySynth fatsawtooth count: 2, spread: 20` + env attack 1.2s + Chorus + Reverb decay 6
- **Stab:** `PolySynth saw + env decay 0.3, sustain: 0` + filter LP 3kHz
- **Lead:** `MonoSynth saw + portamento 0.08 + Vibrato 5Hz depth 0.05`

### 2.8 Sidechain (CORRETO)

**Opção A — Follower invertido (autêntico):**

```typescript
class SidechainBus {
  constructor(public kickSource: Tone.InputNode) {
    this.input = new Tone.Gain(1);
    this.duckGain = new Tone.Gain(1);
    this.output = new Tone.Gain(1);
    this.input.connect(this.duckGain).connect(this.output);

    this.follower = new Tone.Follower(0.005, 0.15);
    this.inverter = new Tone.WaveShaper((x) => Math.max(0, 1 - x * 0.7));

    kickSource.connect(this.follower);
    this.follower.connect(this.inverter);
    this.inverter.connect(this.duckGain.gain);
  }
}
```

**Opção B — LFO sync (Kickstart-style):**

```typescript
const lfo = new Tone.LFO({ frequency: '4n', type: 'sawtooth', min: 0.3, max: 1.0 });
lfo.sync().start(); // pra acompanhar BPM changes
```

Use A no bass, B nos pads.

### 2.9 Saturação

| Tool | Quando |
|------|--------|
| `Tone.Distortion(0.1-0.3)` | Soft-clip bass, parallel drum bus |
| `Tone.Chebyshev(3,5,7)` | Tubo ímpar harmônicos |
| `Tone.Chebyshev(2,4)` | Tape par harmônicos |
| `Tone.WaveShaper(arctan)` | Tape sat customizado |
| `Tone.BitCrusher(8-12)` | Lo-fi deep house |

```typescript
function makeTapeCurve(drive: number, length = 4096): Float32Array {
  const curve = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const x = (i / length) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}
```

SEMPRE `oversample: '2x'` ou `'4x'` em distortions.

### 2.10 Filter

```typescript
const filter = new Tone.Filter({ frequency: 800, type: 'lowpass', rolloff: -24, Q: 6 });
const filterEnv = new Tone.FrequencyEnvelope({
  attack: 0.01, decay: 0.4, sustain: 0,
  baseFrequency: 200, octaves: 5,
});
filterEnv.connect(filter.frequency);

const filterLFO = new Tone.LFO({ frequency: '8m', type: 'sine', min: 400, max: 8000 }).start();
filterLFO.connect(filter.frequency);
filterLFO.sync(); // CRÍTICO sync ao Transport
```

### 2.11 Reverb / Delay

- **Hall:** `Tone.Reverb({ decay: 5, preDelay: 0.05, wet: 0.3 })` + `await reverb.generate()`
- **Plate:** `decay: 1.8, preDelay: 0.005` + EQ3 brilhante
- **Spring:** `Tone.JCReverb(0.7)`
- **Dub Delay:** FeedbackDelay com filter no feedback path

**Send/return:** 1 reverb global, instruments têm `reverbSend` Gain.

### 2.12 Stereo / Mid-Side

- `Tone.StereoWidener(0.8)` em pads
- BASS <200Hz = MONO obrigatório (`Tone.Mono` + highpass 200)

### 2.13 Mastering chain

```typescript
class MasteringChain {
  private eq = new Tone.EQ3({ low: 0.5, mid: -0.5, high: 1, lowFrequency: 200, highFrequency: 4000 });
  private mbComp = new Tone.MultibandCompressor({
    lowFrequency: 200, highFrequency: 2500,
    low:  { threshold: -18, ratio: 3, attack: 0.03, release: 0.15 },
    mid:  { threshold: -16, ratio: 2.5, attack: 0.015, release: 0.1 },
    high: { threshold: -14, ratio: 2, attack: 0.005, release: 0.05 },
  });
  private tape = new Tone.WaveShaper(makeTapeCurve(1.4), 2048);
  private limiter = new Tone.Limiter(-0.3);

  constructor() {
    this.input.chain(this.eq, this.mbComp, this.tape, this.limiter, Tone.getDestination());
  }
}
```

Ordem: EQ → MultibandComp → Saturation → Limiter. Target -7 LUFS integrado pra club.

### 2.14 PolySynth voice management

`maxPolyphony: 6` explícito. PolySynth rouba voice mais antiga (FIFO).

### 2.15 Sequence vs Pattern vs Part vs Loop

| API | Quando |
|-----|--------|
| `Tone.Loop` | Hi-hats simples |
| `Tone.Sequence` | Drum step sequencer (array fixo) |
| `Tone.Pattern` | Arp tech house (modes up/down/random) |
| `Tone.Part` | Melodias progressive (timing arbitrário) |

### 2.16 AudioWorklet custom

NÃO recomendado pra ELIFOOT — complexidade não justifica. Use Tone.js building blocks.

---

## 3. ADAPTIVE GAME MUSIC

### 3.1 Wwise/FMOD → Tone.js

| Wwise | FMOD | Tone.js |
|-------|------|---------|
| Music Switch Container | Multi-track Event | `MusicDirector.transitionTo()` + map stems |
| Transition Matrix | Transition regions | `{from: {to: {fade, sync}}}` object |
| Stinger | One-shot triggered | `Tone.Player` ou synth procedural em `transport.scheduleOnce` |
| Music Sync Points | Markers/Beats | `transport.scheduleOnce(cb, '@1m')` |
| RTPC | Parameter | `Tone.Signal` connections + `.rampTo()` |
| State | Parameter snapshot | `MusicDirector.state` enum |
| Music Callback | Beat events | `transport.scheduleRepeat(cb, '4n')` |
| Vertical layering | Submix activation | Stem volume rampTo |
| Horizontal re-sequencing | Region transitions | Crossfade entre Players quantizado |

### 3.2 Sync points

```typescript
class MusicalCallbacks {
  onBar(cb) {
    let bar = 0;
    Tone.getTransport().scheduleRepeat((t) => cb(t, bar++), '1m');
  }
  onBeat(cb) {
    let beat = 0;
    Tone.getTransport().scheduleRepeat((t) => cb(t, beat++ % 4), '4n');
  }
}

// Tone.Draw pra sync com requestAnimationFrame
musicalCallbacks.onBar((time, bar) => {
  Tone.Draw.schedule(() => flashScoreboard(), time);
});
```

### 3.3 Match-state-to-music mapping

```typescript
function decideMusicState(match: MatchState): MusicConfig {
  const { score, possession, momentum, minute, importance } = match;
  const diff = score.home - score.away;

  // PRE
  if (match.phase === 'pre') {
    return {
      subgenre: 'tech',
      bpm: importance === 'final' ? 128 : 125,
      mode: importance === 'final' ? 'phrygian' : 'minor',
      stemActivity: { drums: 1, bass: 0.9, harmony: 0.7, melody: 0.4, fx: 0.3 },
      filterCutoff: 8000,
    };
  }

  // LIVE
  if (match.phase === 'live') {
    if (Math.abs(diff) === 0 && Math.abs(possession - 0.5) < 0.15 && minute < 70) {
      return { subgenre: 'progressive', bpm: 122 };
    }
    if (diff > 0 && minute > 75) {
      return {
        subgenre: 'progressive', bpm: 124,
        stemActivity: { drums: 1, bass: 1, harmony: 0.5, melody: 0.3, fx: 0.8 },
        filterCutoff: 4000, addRiser: true,
      };
    }
    if (diff < -2) {
      return {
        subgenre: 'ambient', bpm: 110, mode: 'minor',
        stemActivity: { drums: 0.3, bass: 0.5, harmony: 1, melody: 0.7 },
        filterCutoff: 2000,
      };
    }
    if (momentum > 0.6) {
      return {
        subgenre: 'tech', bpm: 128,
        stemActivity: { drums: 1, bass: 1, harmony: 0.8, melody: 0.5, fx: 0.6 },
      };
    }
    return { subgenre: 'progressive', bpm: 122 };
  }

  // POST
  if (match.phase === 'post') {
    if (diff > 0) return importance === 'final'
      ? { subgenre: 'disco', bpm: 124, mode: 'major' }
      : { subgenre: 'funky', bpm: 122, mode: 'major' };
    if (diff < 0) return { subgenre: 'ambient', bpm: 100, mode: 'minor' };
    return { subgenre: 'deep', bpm: 118 };
  }

  return { subgenre: 'deep', bpm: 116, mode: 'minor' };
}
```

### 3.4 Stinger system

```typescript
class StingerSystem {
  fireGoal(team: 'home'|'away') {
    const t = Tone.getTransport().nextSubdivision('1m');
    this.goalStinger.start(t);

    this.riserFilter.frequency.cancelScheduledValues(t);
    this.riserFilter.frequency.setValueAtTime(200, t);
    this.riserFilter.frequency.exponentialRampToValueAtTime(8000, t + 4);
    this.riser.start(t);
    this.riser.stop(t + 4);
  }
}
```

**Pré-renderize 12 versions** (uma por key cromática), select baseado na key da track current — Wwise "harmonically appropriate stingers".

### 3.5 Subgêneros completos

| Subgênero | BPM | Mode | Drums | Bass | Harmony | Ref |
|-----------|-----|------|-------|------|---------|-----|
| **Deep** (Dashboard/Market) | 116-120 | Aeolian/min7 | 909 suave swing 58% | Sub + plucked | Dm9-Gm7-Cmaj7-Fmaj7 | Larry Heard, Dixon |
| **Tech** (PreMatch/Squad) | 125-128 | Phrygian | 909 punchy + claps tight | TB-303 OR plucky saw | i-bII vamp | Carl Cox, Beyer |
| **Progressive** (Live) | 120-124 | Minor + bIII mod | Layered 909 + tom rolls | Reese detuned | i-bVI-bIII-bVII | Solomun, Anyma |
| **Funky** (Chronicle) | 122-128 | Maj7/Mixo | MK swung 16th hat | MPC pluck | ii7-V7-Imaj7 | MK, Disclosure |
| **Ambient** (PlayerDash) | 100-110 | Minor/Lydian | Soft kicks, brushed | Sub or omitted | Sustained pads | Floating Points, Four Tet |
| **Tribal/Afro** (Celebrations) | 120-124 | Aeolian/Mixo | Tom loops + shaker + clave + Brazilian perc | Sub + tom | E minor pedal + piano stabs | Black Coffee, Keinemusik |
| **Acid** (Tense/Rebaixamento) | 120-128 | Pedal Phrygian | 606/909 cru | TB-303 slide+accent | Drone single | Phuture, DJ Pierre |
| **Disco/French** (Glory) | 120-124 | Major | Tight 909 + filtered loops | Filter bass | I-vi-ii-V loops | Daft Punk, Stardust |

### 3.6 Brazilian percussion

```typescript
const surdo = new Tone.Sampler({ urls: { A1: 'surdo_low.wav', E2: 'surdo_high.wav' } });

// Tamborim samba clave: . . X . . X . X X . X . X . . .
const tamborimPattern = ['_','_','C5','_','_','C5','_','C5','C5','_','C5','_','C5','_','_','_'];
new Tone.Sequence((time, n) => {
  if (n !== '_') tamborim.triggerAttackRelease(n, '32n', time, 0.7);
}, tamborimPattern, '16n').start(0);

// Surdo: beat 2 e 4 forte
new Tone.Sequence((time, n) => {
  if (n) surdo.triggerAttackRelease('A1', '4n', time);
}, [null, 'X', null, 'X'], '4n').start(0);
```

Samba batucada swing natural ~62% → `swing = 0.22` no perc bus.

### 3.7 Generative composition

```typescript
const MODE_DEGREES = {
  minor:      [0, 2, 3, 5, 7, 8, 10],
  phrygian:   [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian:     [0, 2, 3, 5, 7, 9, 10],
  major:      [0, 2, 4, 5, 7, 9, 11],
};

const PROGRESSION_TEMPLATES = {
  deep:        [[0,7,[-2,true]], [3,6,[-1,true]], [5,7,[0,false]]],  // ii-V-I
  tech:        [[0,0,[0,false]], [1,0,[0,false]]],                    // i-bII Phrygian
  progressive: [[0,7,[0,false]], [5,7,[0,false]], [2,7,[0,false]], [6,7,[0,false]]],
  funky:       [[1,7,[0,false]], [4,7,[0,false]], [0,7,[0,true]]],   // ii7-V7-Imaj7
  acid:        [[0,0,[0,false]]],                                     // pedal
};
```

Markov melody: 70% step, 20% leap, 10% rest.

### 3.8 Drum fill generation

Disparado nos últimos 2 bars antes de drop:

```typescript
musicDirector.onBar((time, bar) => {
  if (bar > 0 && bar % 16 === 14) {
    const fill = generateDrumFill(rng, currentIntensity);
    scheduleDrumFill(fill, time);
  }
});
```

### 3.9 Story mode 50+ tracks

**Strategy: small base set + parameter variation**

```typescript
const VARIATION_AXES = {
  keys: ['Am','Bm','Cm','Dm','Em','F#m','Gm'],  // 7
  energies: [0.3, 0.5, 0.7, 0.9],                // 4
  lengthMultipliers: [1, 1.5, 2],                // 3
};
// 7 × 4 × 3 = 84 variations por template
```

Variations NÃO são apenas transposição — vary hi-hat density, accent positions, pad voicing inversions, drum fill probability.

### 3.10 Producer references

| Producer | Técnica replicável |
|----------|-------------------|
| **Carl Cox** | 909 + clap 2/4, 16th hat shuffle 0.08, Phrygian pedal, swing 0.05-0.10 |
| **Dixon** | Pads 5s release, sample chops pitch shift, sidechain sutil 0.3, reverb 30%+ |
| **MK** | Vocal chop sampler + filter auto, pluck bass short env, swing 0.18-0.20 |
| **Solomun** | Progressive emocional: i-bVI-bIII-bVII spread 2 oitavas, lead portamento 80ms, builds 16-bar filter sweep |
| **Black Coffee** | Tom loops como groove driver, piano stabs aeolian/mixo, perc densa, sub rolling |
| **Daft Punk** | Filter auto agressivo 4-bar loops, parallel comp heavy, samples disco filtrados |
| **Adam Beyer** | Kick distorted Chebyshev order 5+, multibass OTT-style, perc metálicas |
| **Floating Points** | Humanize +8ms, modal harmony 7th/9th, modulation sutil |
| **DJ Pierre** | TB-303 slide+accent variando, sweeps live, distortion heavy, pedal harmonic |
| **Frankie Knuckles** | 909 tight, Heard pads (Dm9-G9-Cmaj7), vocal samples ducked, simple groove-driven |

---

## Recommendations

### Fase 1 (Sprint 1-2): Foundation runtime + 1 subgênero

1. `MasterBus`, `SidechainBus`, `MasteringChain` como singletons globais
2. `Kick909`, `Snare909`, `HiHats909`, `Acid303` classes (test isoladamente)
3. `MusicDirector` FSM 2 estados (`dashboard`, `live`) + 1 subgênero (deep house) + 4 stems pre-rendered
4. **Threshold:** transição quantizada à barra, sem clicks. Sidechain pumping musical.

### Fase 2 (Sprint 3-5): Pipeline offline + 4 subgêneros

5. Renderer Node script. 16 tracks (4 subgêneros × 4 variations)
6. Adicione `tech`, `progressive`, `funky`, `ambient`
7. RTPC: momentum, intensity, scoreDiff → filter cutoff + stem volumes
8. **Threshold:** demo 5 min passando 4 estados, transições limpas, soa como mix DJ amador competente

### Fase 3 (Sprint 6-8): Stingers + Brazilian + full library

9. `StingerSystem` 3 stingers (goal, card, whistle)
10. Layer percussão brasileira selecionável
11. Renderize 72+ tracks via batch
12. Subgêneros restantes: `tribal/afro`, `acid`, `disco`
13. **Threshold:** partida completa = trilha não repete em 90 min, ≥6 trocas stems sutis + 1-3 stingers

### Fase 4 (Sprint 9+): Polish + profile

14. Profile `chrome://tracing` + WebAudio extension. Target render <70%
15. Fallback qualidade — mobile/CPU lento descarta FX, OGG 96kbps
16. A/B teste real — música perceptível mas não dominante

### Anti-patterns EVITAR

- Renderizar tudo runtime no client (estoura CPU mobile)
- `Tone.Compressor` esperando sidechain key (não existe Web Audio)
- Crossfades lineares em transições musicais (use equal-power)
- Crossfades meio de barra (sempre quantize `'@1m'`)
- Stereo widener <200Hz (destrói mono compat)
- Reverbs diferentes por instrumento (use sends)
- `Tone.MembraneSynth` puro como kick 909 (insuficiente)
- LFO sidechain sem `.sync()` (dessincroniza com BPM changes)

---

## Caveats

1. **Tone.Offline em Node frágil** — assume browser. Use Puppeteer (headless Chrome AudioContext real) ou `node-web-audio-api` (cobertura incompleta). Issue #551 artefatos >120s.

2. **`DynamicsCompressorNode` sem sidechain key** — limitação W3C spec. Workarounds (Follower+inverter, LFO sync) não tão musical quanto SSL G-bus real. Pra classe-A: pré-render sidechain dentro dos stems offline.

3. **Performance varia massivamente** — Chrome desktop 32+ voices fácil; Safari iOS pode glitch em 16. Teste low-end mobile (iPhone SE, Android budget). Modos degradados sempre.

4. **iOS requer user interaction** pra `Tone.start()` E OfflineAudioContext (issue #234). Primeiro start DENTRO de event handler click/touch.

5. **MPC swing diferente entre DAWs** — MPC: 50%=neutral, Cubase/FL/Tone: 0%=neutral. Pra 54% MPC use `0.16`. Pra 58% use `0.22`. Pra 66% (triplet) use `0.5`. Calibre auditivamente.

6. **TB-303 IMITAÇÃO, não emulação fiel** — filtro 18dB ladder real tem comportamento não-linear. `Tone.Filter rolloff: -24` aproxima. Pra autenticidade: AudioWorklet custom (Open303 portado). Pra ELIFOOT: aproximação suficiente.

7. **`Tone.Reverb.generate()` async + custa CPU** — gere UMA vez no boot, NUNCA dispose. Mudar buffer ConvolverNode pode falhar Chrome (issue #392).

8. **Generative pode soar AI-derivative** — use templates compositivos curados (Larry Heard, Solomun transcribed), RNG só pra variations sutis (transposition, voicing, drum fill density). Repetição = feature, não bug.

9. **Sample-rate mismatch** — Web Audio default 44.1kHz mas alguns 48kHz. Force `new Tone.Context({sampleRate: 44100})` no boot.

10. **Direitos sobre samples** — sample track real (Daft Punk, MK) = direitos. ELIFOOT só samples originais ou royalty-free (Loopcloud, Splice commercial), ou síntese pura. Refs aqui = aprender estilo, não copiar masters.

11. **Adaptive music research** (Skyrim, Sekiro, BPM) refere-se a Wwise/FMOD em engines tradicionais. Tone.js browser tem latência ~10-20ms typical lookAhead, menos sample-accurate em mobile. Pra manager game ELIFOOT = IRRELEVANTE. Pra rhythm game seria diferente.

12. **72+ tracks só com pré-render offline** — runtime synthesis quebraria CPU. Estratégia híbrida (8-10 templates × 8-10 variations = 64-100 tracks) funciona. NÃO componha 72 tracks únicas à mão; gere variations de templates curados com controle artístico nos seeds.

---

**Status:** Manual oficial ELIFOOT Music Engine
**Aprovado:** Dudu, 2026-05-08
**Próximo:** AKITA-103 Fase 1 (Foundation runtime + deep house)
