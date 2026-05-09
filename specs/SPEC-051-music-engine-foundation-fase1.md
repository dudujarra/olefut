# SPEC-051: Music Engine Foundation Fase 1 (AKITA-103)

> **Implementar Foundation runtime + 1 subgênero (deep house) seguindo MANUAL-TONE-JS-MUSIC-ENGINE.md à risca. Output: 1 track deep house renderizada com club-quality real (kick 909 layered, sidechain Follower, mastering chain).**

> **Referência canônica:** `specs/MANUAL-TONE-JS-MUSIC-ENGINE.md`

---

## O que é

Refazer audio system do zero seguindo **estritamente** o manual técnico aprovado. Alvo: 1 track deep house (~32 bars, 4 stems separados) que soa como Larry Heard / Dixon — não bipe genérico.

Substituir `scripts/test-synth.js` (síntese oscilador puro Node) por pipeline correto:
- `src/audio/synth/Kick909.js` — 3 camadas paralelas (body+click+sub)
- `src/audio/synth/Snare909.js` — 2 layers (tonal+noise)
- `src/audio/synth/HiHats909.js` — bandpass 8kHz + choke
- `src/audio/synth/Acid303.js` — saw + LP rolloff -24 + slide via setNote
- `src/audio/synth/Pad.js` — fatsawtooth + Chorus + Reverb
- `src/audio/buses/SidechainBus.js` — Follower 0.005/0.15 + WaveShaper invert
- `src/audio/buses/MasteringChain.js` — EQ3 → MultibandComp → tape → Limiter -0.3 dBTP
- `src/audio/utils/mulberry32.js` — RNG determinístico
- `src/audio/utils/tape-curve.js` — `makeTapeCurve(drive)` arctan
- `scripts/render-fase1.js` — Puppeteer + Tone.Offline render 1 track deep
- `public/audio/fase1/deep_house_v1_drums.wav` (+ bass, harmony, melody)

Tudo executável, validável auditivamente, gate CI.

---

## Input

```typescript
{
  trackSeed: {
    id: 'deep_house_v1',
    subgenre: 'deep',
    bpm: 118,                       // dentro 116-120 deep house
    key: 'Am',                      // Aeolian/minor
    mode: 'minor',
    length: 32,                     // bars
    energyCurve: [0.3, 0.4, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4],
    stems: ['drums', 'bass', 'harmony', 'melody'],
    rngSeed: 12345
  },
  outputDir: 'public/audio/fase1/',
  rendererMode: 'puppeteer',        // headless Chrome AudioContext real
  validateAuditory: true            // threshold: kick punch + sidechain pumping audíveis
}
```

---

## Output

### Tipo

```typescript
{
  rendered: {
    trackId: string,                  // 'deep_house_v1'
    stems: Array<{
      name: 'drums'|'bass'|'harmony'|'melody',
      filePath: string,               // 'public/audio/fase1/deep_house_v1_drums.wav'
      duration: number,               // ~65s (32 bars @ 118 BPM)
      sampleRate: 44100,
      bitDepth: 16,
      sizeBytes: number               // > 1MB cada
    }>,
    masterMixPath: string,            // 'public/audio/fase1/deep_house_v1_master.wav'
    metadata: {
      synthStack: {
        kick: 'Kick909 (3-layer: triangle+Chebyshev3 + noise bandpass 3kHz + sub)',
        bass: 'MonoSynth sine + Distortion 0.08 + portamento 0.02',
        pads: 'PolySynth fatsawtooth count:2 spread:20 + Chorus 0.5Hz + Reverb decay:6',
      },
      sidechainEnabled: true,         // Follower-based, attack 0.005/release 0.15
      masteringApplied: true,         // EQ3 → MultibandComp → tape → Limiter -0.3
      swing: 0.20,                    // 56% MPC pra deep house
      chordProgression: 'i7-iv7-VII7-III7' // Aeolian template (Larry Heard)
    }
  },
  validation: {
    passed: boolean,
    auditoryChecks: {
      kickPunchAudible: boolean,      // peak energy >50Hz no waveform
      sidechainPumpingDetected: boolean, // amplitude modulation 4n cycle
      masterRMS: number,              // -14 to -10 dBFS
      noClipping: boolean,            // peak < -0.3 dBFS
      stemsNotEmpty: boolean          // todos > 1MB
    },
    errors: string[]
  }
}
```

### Exemplo concreto

```json
{
  "rendered": {
    "trackId": "deep_house_v1",
    "stems": [
      { "name": "drums", "filePath": "public/audio/fase1/deep_house_v1_drums.wav", "duration": 65.08, "sizeBytes": 5740000 },
      { "name": "bass",  "filePath": "public/audio/fase1/deep_house_v1_bass.wav",  "duration": 65.08, "sizeBytes": 5740000 },
      { "name": "harmony","filePath": "public/audio/fase1/deep_house_v1_harmony.wav","duration": 65.08, "sizeBytes": 5740000 },
      { "name": "melody", "filePath": "public/audio/fase1/deep_house_v1_melody.wav", "duration": 65.08, "sizeBytes": 5740000 }
    ],
    "masterMixPath": "public/audio/fase1/deep_house_v1_master.wav",
    "metadata": {
      "synthStack": { "kick": "Kick909 (3-layer)", "bass": "MonoSynth sine + Dist", "pads": "PolySynth fatsaw+Chorus+Reverb" },
      "sidechainEnabled": true,
      "masteringApplied": true,
      "swing": 0.20,
      "chordProgression": "i7-iv7-VII7-III7"
    }
  },
  "validation": {
    "passed": true,
    "auditoryChecks": {
      "kickPunchAudible": true,
      "sidechainPumpingDetected": true,
      "masterRMS": -12.4,
      "noClipping": true,
      "stemsNotEmpty": true
    },
    "errors": []
  }
}
```

---

## Regras de validação

### 1. Estrutura de arquivos

- [ ] `src/audio/synth/Kick909.js` existe + classe exportada
- [ ] `src/audio/synth/Snare909.js` existe + classe exportada
- [ ] `src/audio/synth/HiHats909.js` existe + classe exportada
- [ ] `src/audio/synth/Acid303.js` existe + classe exportada
- [ ] `src/audio/synth/Pad.js` existe + classe exportada
- [ ] `src/audio/buses/SidechainBus.js` existe
- [ ] `src/audio/buses/MasteringChain.js` existe
- [ ] `src/audio/utils/mulberry32.js` existe
- [ ] `scripts/render-fase1.js` existe + executável

### 2. Kick909 conforme manual seção 2.1

- [ ] Triangle oscillator @ 50Hz base
- [ ] FrequencyEnvelope: attack 0.001, decay 0.03, baseFrequency 50, octaves 1.6, exponent 2.5
- [ ] Chebyshev order 3 saturator
- [ ] AmplitudeEnvelope: attack 0.001, decay 0.45, exponential curves
- [ ] Click: white noise → bandpass 3kHz Q=1.2 → env attack 0.0005 decay 0.008
- [ ] Click gain 0.4 antes de somar
- [ ] Trigger method assinatura: `trigger(time, velocity = 1)`

### 3. Acid303 conforme manual seção 2.5

- [ ] MonoSynth saw oscillator
- [ ] Filter lowpass `rolloff: -24, Q: 8`
- [ ] FilterEnvelope: baseFrequency 200, octaves 4, exponent 2
- [ ] Distortion 0.4 oversample 2x APÓS filter
- [ ] Slide: usa `synth.setNote(note, time)` NÃO `triggerAttack`
- [ ] Slide preserva envelope state (`portamento: 0.06`)
- [ ] Accent: Q boosted para 14, octaves para 5.5

### 4. SidechainBus conforme manual seção 2.8 Opção A

- [ ] `Tone.Follower(0.005, 0.15)` attack/release
- [ ] WaveShaper inverter: `(x) => Math.max(0, 1 - x * 0.7)`
- [ ] Routing: `kickSource → follower → inverter → duckGain.gain`
- [ ] `input → duckGain → output` para bass/harmony bus
- [ ] NÃO usa `Tone.Compressor` esperando sidechain key

### 5. MasteringChain conforme manual seção 2.13

- [ ] EQ3: `low: 0.5, mid: -0.5, high: 1, lowFrequency: 200, highFrequency: 4000`
- [ ] MultibandCompressor: lowFrequency 200, highFrequency 2500
- [ ] Tape: `WaveShaper(makeTapeCurve(1.4), 2048)`
- [ ] Limiter: `-0.3` dBTP
- [ ] Ordem fixa: `EQ3 → MultibandComp → tape → Limiter → Destination`

### 6. Render output

- [ ] 4 arquivos WAV em `public/audio/fase1/` (drums, bass, harmony, melody)
- [ ] +1 master mix WAV
- [ ] Cada stem: 44100 Hz, 16-bit, ~65s, ≥4 MB
- [ ] Master mix: stereo, peak < -0.3 dBFS, RMS -14 a -10 dBFS

### 7. Auditory threshold (manual)

- [ ] Tocar `deep_house_v1_master.wav`: kick com punch (não bipe)
- [ ] Sidechain pumping audível em pads/bass (groove respirando)
- [ ] Pads quentes sustained (não squelchy)
- [ ] Sem clipping audível
- [ ] Soa como Larry Heard / Dixon (Dudu valida auditivamente)

### 8. Determinismo

- [ ] Mesmo `rngSeed: 12345` → output binariamente idêntico em 2 runs
- [ ] BPM exato 118
- [ ] Swing exato 0.20

---

## Forbidden

### Anti-patterns do manual (auto-rejeição)

- [ ] **Tone.MembraneSynth puro como kick 909** (manual seção 2.1 explícito)
- [ ] **Tone.Compressor com sidechain key** (não existe Web Audio)
- [ ] **Síntese de osciladores puros em Node sem Tone.js** (test-synth.js atual)
- [ ] **Crossfades lineares** (use equal-power)
- [ ] **Crossfades meio de barra** (sempre `'@1m'`)
- [ ] **Reverb por instrumento** (use sends, 1 reverb por bus)
- [ ] **LFO sidechain sem `.sync()`**
- [ ] **`oversample` sem `'2x'` ou `'4x'`** em distortions
- [ ] **Stereo widener <200Hz**

### Render incorreto

- [ ] WAV com bytes zerados (renderer falhou silenciosamente)
- [ ] WAV mono quando deveria ser stereo
- [ ] Sample rate ≠ 44100
- [ ] Mix completo gerado (precisa stems SEPARADOS — manual seção 1.2)
- [ ] Renderização em data URL Puppeteer (usar localhost HTTP)

### Skip de validação

- [ ] Não testar audição real
- [ ] Não verificar `Tone.start()` chamado antes do offline
- [ ] Pular check de master peak/RMS

---

## Implementação

### Arquivos novos

```
src/audio/
├── synth/
│   ├── Kick909.js        ← 3-layer
│   ├── Snare909.js       ← 2-layer
│   ├── HiHats909.js      ← bandpass+choke
│   ├── Acid303.js        ← saw+LP24+slide
│   └── Pad.js            ← fatsaw+Chorus+Reverb
├── buses/
│   ├── SidechainBus.js   ← Follower-based
│   └── MasteringChain.js ← EQ3+MBComp+Limiter
├── utils/
│   ├── mulberry32.js
│   └── tape-curve.js     ← makeTapeCurve(drive)
└── compositions/
    └── deep-house-v1.js  ← orquestra synths + patterns

scripts/
├── render-fase1.js       ← Puppeteer + Tone.Offline render
└── render-fase1-page.html ← inline HTML servido localhost
```

### CLI

```bash
npm run render:fase1                # full render 1 track 4 stems + master
npm run render:fase1 -- --validate  # roda + auditory checks + gate
```

### Dependencies

- `tone@^14.9.17` (já instalado)
- `puppeteer@^23.11.1` (já instalado)
- `wav-encoder@^1.3.0` (instalar)

---

## Testes esperados

Mínimo 8 testes:

```javascript
describe('SPEC-051: Music Engine Fase 1', () => {
  test('Kick909: 3-layer architecture (rule 2)', () => {
    const kick = new Kick909(destination);
    expect(kick.body).toBeInstanceOf(Tone.Oscillator);
    expect(kick.body.type).toBe('triangle');
    expect(kick.saturator).toBeInstanceOf(Tone.Chebyshev);
    expect(kick.saturator.order).toBe(3);
    expect(kick.clickFilter.frequency.value).toBe(3000);
  });

  test('Acid303: slide uses setNote not triggerAttack (rule 3)', () => {
    const acid = new Acid303(destination);
    const setNoteSpy = vi.spyOn(acid.synth, 'setNote');
    const triggerSpy = vi.spyOn(acid.synth, 'triggerAttackRelease');
    acid.playStep('C2', 0, '16n', false, false);  // first note
    acid.playStep('D2', '16n', '16n', false, true); // slide
    expect(setNoteSpy).toHaveBeenCalled();
    expect(triggerSpy).toHaveBeenCalledTimes(1); // only first
  });

  test('SidechainBus: Follower-based not Compressor (rule 4)', () => {
    const sc = new SidechainBus(kickBus);
    expect(sc.follower).toBeInstanceOf(Tone.Follower);
    expect(sc.inverter).toBeInstanceOf(Tone.WaveShaper);
    expect(sc.compressor).toBeUndefined(); // forbidden
  });

  test('MasteringChain: EQ3 → MBComp → tape → Limiter order (rule 5)', () => {
    const m = new MasteringChain();
    expect(m.eq).toBeInstanceOf(Tone.EQ3);
    expect(m.mbComp).toBeInstanceOf(Tone.MultibandCompressor);
    expect(m.limiter.threshold.value).toBe(-0.3);
  });

  test('Render output: 4 stems + master, valid WAVs (rule 6)', async () => {
    const result = await renderFase1();
    expect(result.rendered.stems).toHaveLength(4);
    for (const stem of result.rendered.stems) {
      const stat = fs.statSync(stem.filePath);
      expect(stat.size).toBeGreaterThan(4_000_000);
    }
  });

  test('Determinism: same seed = same output (rule 8)', async () => {
    const r1 = await renderFase1({ rngSeed: 12345 });
    const r2 = await renderFase1({ rngSeed: 12345 });
    const buf1 = fs.readFileSync(r1.rendered.stems[0].filePath);
    const buf2 = fs.readFileSync(r2.rendered.stems[0].filePath);
    expect(buf1.equals(buf2)).toBe(true);
  });

  test('Forbidden: no MembraneSynth as kick', () => {
    const code = fs.readFileSync('src/audio/synth/Kick909.js', 'utf8');
    expect(code).not.toContain('MembraneSynth');
  });

  test('Auditory: master peak < -0.3 dBFS (rule 7)', async () => {
    const result = await renderFase1();
    expect(result.validation.auditoryChecks.noClipping).toBe(true);
    expect(result.validation.auditoryChecks.masterRMS).toBeGreaterThan(-14);
    expect(result.validation.auditoryChecks.masterRMS).toBeLessThan(-10);
  });
});
```

---

## Harness (CI gate)

`scripts/validate-fase1.js`:
```javascript
const result = await renderFase1();
if (!result.validation.passed) {
  console.error('❌ Validation failed:', result.validation.errors);
  process.exit(1);
}
const masterStat = fs.statSync(result.rendered.masterMixPath);
if (masterStat.size < 4_000_000) {
  console.error('❌ Master mix muito pequeno (provável zeros)');
  process.exit(1);
}
console.log('✅ Fase 1 valid');
```

CI: `.github/workflows/audio-fase1.yml` roda `npm run render:fase1 -- --validate` em push de `src/audio/**`.

---

## Checklist pre-spec approval

- [x] O que é: claro (refazer audio do zero seguindo manual)
- [x] Input: tipado (TrackSeed)
- [x] Output: tipado + exemplo
- [x] Validação: 8 regras (checkbox)
- [x] Forbidden: 12 anti-patterns
- [x] Implementação: arquivos + CLI específicos
- [x] Testes: 8 casos
- [x] Harness: gate CI

---

**Status:** Aguardando aprovação Dudu
**Bloqueia:** AKITA-103 implementação
**Referência:** specs/MANUAL-TONE-JS-MUSIC-ENGINE.md (todas seções 1.x, 2.x, 3.x)
