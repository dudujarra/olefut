# SPEC-050: Audio Soundtrack System (Tone.js + 16-bit SNES House)

> **Generate 72+ unique tracks programmatically using Tone.js synthesis + SUNO prompt generation. All tracks must be 16-bit SNES-style house music, contextualized by game moment, with high-end sound design.**

---

## O que é

Sistema automatizado que gera **72 faixas de áudio** para ELIFOOT RPG:
- **4 contexto** (menu, dashboard, player home, chronicle)
- **2 pré-jogo** (formação, buildup)
- **50 match grooves** (cada match = unique, dinâmico)
- **9 pós-jogo** (vitória/derrota/empate + variantes)
- **6 narrativa** (lesão, promoção, auge, etc)
- **1 administrativo** (reutilizável transições)

Cada trilha é:
- **Gerada via Tone.js** (síntese FM + wavetable + efeitos)
- **Exportada MIDI + WAV** (16-bit SNES warmth)
- **Mapeada a prompt SUNO** (pra regeneração/ajuste)
- **Versionada em Git** (metadata.json)

---

## Input

### Tipo
```typescript
{
  mode: 'generate' | 'validate' | 'export',
  outputDir: string,      // "public/audio"
  vertentes: {
    deep: { bpm: 110-120, mood: 'warm', intensity: 0.3 },
    tech: { bpm: 125-130, mood: 'industrial', intensity: 0.7 },
    progressive: { bpm: 120-125, mood: 'buildup', intensity: 0.5-1.0 },
    funky: { bpm: 120-128, mood: 'groovy', intensity: 0.6 },
    ambient: { bpm: 100-110, mood: 'atmospheric', intensity: 0.2 }
  },
  matchDynamics: {
    seed: number,           // deterministic generation
    momentumFactor: 0-1,    // 0=losing, 1=winning
    phaseOfMatch: 1|2|3,    // 1=0-30min, 2=31-60min, 3=61-90min
    importance: 'routine' | 'important' | 'critical'
  },
  sunoApiKey?: string,      // optional, pra regenerar via SUNO
  dryRun?: boolean          // test without writing files
}
```

### Origem
- CLI: `npm run generate:audio`
- Build CI: `.github/workflows/audio-generation.yml`
- Runtime: `src/audio/AudioGenerator.js` (pré-load)

---

## Output esperado

### Tipo
```typescript
{
  generated: {
    tracks: Array<{
      id: string,                     // "context_start_menu"
      filename: string,               // "start_menu.wav"
      vertente: string,              // "progressive"
      duration: number,              // seconds
      bpm: number,
      midiBase: string,              // "start_menu.mid"
      waveform: Buffer,              // WAV binary
      metadata: {
        context: string,             // "menu" | "match" | "narrative"
        moment: string,              // "pre-game" | "victory"
        personalization: {
          clubId?: number,
          seasonWeek?: number,
          momentumFactor?: number
        },
        sunoPrompt: string,          // prompt usado/regenerable
        synthesis: {
          oscs: string[],            // ["sine", "sawtooth", "square"]
          effects: string[],         // ["reverb", "delay", "distortion"]
          masterChain: string
        }
      }
    }>,
    manifest: {
      totalCount: number,            // 72+
      vertentes: {
        deep: number,
        tech: number,
        progressive: number,
        funky: number,
        ambient: number
      },
      categories: {
        context: number,             // 4
        preMatch: number,            // 2
        match: number,               // 50
        postMatch: number,           // 9
        narrative: number,           // 6
        admin: number                // 1
      }
    }
  },
  validation: {
    passed: boolean,
    errors: string[],
    warnings: string[]
  },
  sunoPrompts: Array<{
    trackId: string,
    prompt: string,
    variant: number              // which variation (1-5)
  }>
}
```

### Exemplo concreto

```json
{
  "generated": {
    "tracks": [
      {
        "id": "context_dashboard_deep",
        "filename": "dashboard_deep_001.wav",
        "vertente": "deep",
        "duration": 180,
        "bpm": 115,
        "midiBase": "dashboard_deep_001.mid",
        "metadata": {
          "context": "menu",
          "moment": "manager_home",
          "personalization": {
            "clubId": 5,
            "seasonWeek": 12
          },
          "sunoPrompt": "Deep house, 115 BPM, warm introspective vibe, fat sawtooth bass, sustained pad chords, 16-bit SNES synth warmth, minimal kick, São Paulo club aesthetic, 3:00",
          "synthesis": {
            "oscs": ["sawtooth", "triangle", "sine"],
            "effects": ["reverb", "delay", "distortion"],
            "masterChain": "synth → filter → delay → reverb → compressor → limiter → output"
          }
        }
      },
      {
        "id": "match_base_momentum_001",
        "filename": "match_momentum_001_phase1.wav",
        "vertente": "progressive",
        "duration": 120,
        "bpm": 122,
        "midiBase": "match_momentum_001_phase1.mid",
        "metadata": {
          "context": "match",
          "moment": "first_half",
          "personalization": {
            "momentumFactor": 0.6,
            "phaseOfMatch": 1,
            "importance": "important"
          },
          "sunoPrompt": "Progressive house, 122 BPM, building energy, tight 808 kick, syncopated bass, layered synth stabs, Brazilian percussion rolls, 16-bit SNES warmth, first half tension, 2:00",
          "synthesis": {
            "oscs": ["sine", "square", "sawtooth"],
            "effects": ["reverb", "delay", "distortion", "filter_envelope"],
            "masterChain": "synth → sidechain_compressor → delay → reverb → limiter"
          }
        }
      }
    ],
    "manifest": {
      "totalCount": 72,
      "vertentes": {
        "deep": 12,
        "tech": 18,
        "progressive": 20,
        "funky": 15,
        "ambient": 7
      },
      "categories": {
        "context": 4,
        "preMatch": 2,
        "match": 50,
        "postMatch": 9,
        "narrative": 6,
        "admin": 1
      }
    }
  },
  "validation": {
    "passed": true,
    "errors": [],
    "warnings": []
  },
  "sunoPrompts": [
    {
      "trackId": "context_dashboard_deep",
      "prompt": "Deep house, 115 BPM, warm introspective vibe...",
      "variant": 1
    }
  ]
}
```

---

## Regras de validação

### 1. Geração completa
- [ ] **72+ faixas geradas** (não 71, não 73, exatamente 72+)
- [ ] Cada faixa tem ID único
- [ ] Cada faixa tem filename único (sem colisão)
- [ ] Nenhuma faixa sobrescreve outra

### 2. Categorias
- [ ] **Context**: exatamente 4 (menu, dashboard, player, chronicle)
- [ ] **PreMatch**: exatamente 2 (formation, buildup)
- [ ] **Match**: exatamente 50 base grooves (variações dinâmicas por fase/momentum)
- [ ] **PostMatch**: 3 base (victory/defeat/draw) + 6 variantes (importance) = 9
- [ ] **Narrative**: exatamente 6 (injury, promotion, peak, legend, firstwin, relegation)
- [ ] **Admin**: exatamente 1

### 3. Vertentes (distribuição)
- [ ] **Deep house**: 10-15% (12)
- [ ] **Tech house**: 20-25% (18)
- [ ] **Progressive house**: 25-30% (20)
- [ ] **Funky house**: 15-20% (15)
- [ ] **Ambient house**: 8-10% (7)

### 4. Síntese de áudio
- [ ] Cada WAV é válido (não corrupted, decodable)
- [ ] Duração: 60-300 segundos (match = ~120s, context = ~180s)
- [ ] Sample rate: 44.1kHz (CD quality)
- [ ] Bit depth: 16-bit (SNES aesthetic)
- [ ] Mono ou stereo (stereo preferred, reverb)

### 5. MIDI Base
- [ ] Cada MIDI tem 1-4 tracks (kick, bass, chords, hi-hat)
- [ ] BPM conforme vertente (deep=110-120, tech=125-130, etc)
- [ ] Duração MIDI: 1-4 bars (loopable)
- [ ] Drum pattern válido (kick on beat 1)
- [ ] Bass notes in range C1-C4
- [ ] Melodia notas válidas (não NaN, não fora de escala)

### 6. Metadata
- [ ] Cada track tem `sunoPrompt` (não vazio, >50 chars)
- [ ] `sunoPrompt` menciona: vertente + BPM + mood + instrumentation + duration
- [ ] `personalization` fields preenchidos conforme contexto
- [ ] `synthesis.masterChain` descreve pipeline (synth → effects → output)

### 7. Determinismo
- [ ] Mesmo seed → mesmo output (match grooves reproduzíveis)
- [ ] Diferentes seeds → diferentes grooves (não clone)
- [ ] Context tracks sempre idênticos (determinísticos, seed=0)

### 8. Manifest
- [ ] Soma categorias = 72
- [ ] Soma vertentes = 72
- [ ] Sem duplicatas em manifest

---

## Forbidden

### ❌ Geração incompleta
- [ ] Menos de 72 faixas geradas
- [ ] Qualquer categoria com 0 faixas
- [ ] Match grooves < 50

### ❌ Audio corrompido
- [ ] WAV com tamanho 0 bytes
- [ ] WAV não-decodable (corrupted header)
- [ ] MIDI vazio ou sem events
- [ ] Duração faixa = 0 ou > 600s
- [ ] Sample rate ≠ 44.1kHz

### ❌ Metadata incompleta
- [ ] Track sem `sunoPrompt`
- [ ] Track sem `context` ou `moment`
- [ ] `synthesis.masterChain` vazio
- [ ] Filename não-único (duplicado)

### ❌ Vertentes ignoradas
- [ ] Groove gerado ignora BPM vertente (tech = 125-130, não 110)
- [ ] Mood não reflete vertente (deep groove com synthetic kick pesado)
- [ ] Kick pattern não-sensível ao contexto (match climax = mesmo que routine)

### ❌ Determinismo quebrado
- [ ] Match groove A + seed=123 → groove B (não determinístico)
- [ ] Context track muda entre runs (devem ser fixos)
- [ ] Manifest conta errado (72 vs real count)

### ❌ Suno prompt inválido
- [ ] Prompt < 30 caracteres
- [ ] Prompt não menciona vertente
- [ ] Prompt não menciona BPM
- [ ] Prompt duration não-especificado

---

## Implementação

### Arquivos
- **Gerador**: `scripts/generate-audio.js` (Node.js entry point)
- **Core**: `src/audio/AudioGenerator.js` (Tone.js synthesis)
- **MIDI**: `src/audio/MidiBuilder.js` (midiutil wrapper)
- **Suno Prompts**: `src/audio/SunoPromptGenerator.js`
- **Output**: `public/audio/` (WAV + MIDI)
- **Metadata**: `public/audio/metadata.json`

### CLI
```bash
npm run generate:audio                    # full generation
npm run generate:audio -- --dry-run       # test only
npm run generate:audio -- --seed 12345    # deterministic match grooves
npm run generate:audio -- --vertente tech # only tech house
```

### Dependencies
- `tone` (síntese + WAV export)
- `midiutil` (MIDI generation)
- `crypto` (seeding)

---

## Testes esperados

Mínimo **10 testes**, cada um valida 1 regra:

```javascript
describe('SPEC-050: Audio Soundtrack System', () => {
  
  test('generation: 72+ tracks created (rule 1)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    expect(result.generated.tracks.length).toBeGreaterThanOrEqual(72);
  });

  test('categories: context=4, preMatch=2, match=50, postMatch=9, narrative=6, admin=1 (rule 2)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    const manifest = result.generated.manifest.categories;
    expect(manifest.context).toBe(4);
    expect(manifest.preMatch).toBe(2);
    expect(manifest.match).toBe(50);
    expect(manifest.postMatch).toBe(9);
    expect(manifest.narrative).toBe(6);
    expect(manifest.admin).toBe(1);
  });

  test('vertentes: distribution within bounds (rule 3)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    const v = result.generated.manifest.vertentes;
    expect(v.deep).toBeGreaterThanOrEqual(10);
    expect(v.deep).toBeLessThanOrEqual(15);
    expect(v.tech).toBeGreaterThanOrEqual(15);
    expect(v.tech).toBeLessThanOrEqual(25);
  });

  test('audio: all WAVs valid, 44.1kHz, 16-bit (rule 4)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    for (const track of result.generated.tracks) {
      const wav = fs.readFileSync(`public/audio/${track.filename}`);
      expect(wav.length).toBeGreaterThan(1000);  // not empty
      expect(track.duration).toBeGreaterThanOrEqual(60);
      expect(track.duration).toBeLessThanOrEqual(300);
    }
  });

  test('midi: each track has valid MIDI base (rule 5)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    for (const track of result.generated.tracks) {
      const midi = fs.readFileSync(`public/audio/${track.midiBase}`);
      expect(midi.length).toBeGreaterThan(200);  // not empty
      // Validate MIDI header (4D 54 68 64 = "MThd")
      expect(midi.slice(0, 4).toString('hex')).toBe('4d546864');
    }
  });

  test('metadata: all tracks have sunoPrompt >50 chars (rule 6)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    for (const track of result.generated.tracks) {
      expect(track.metadata.sunoPrompt).toBeDefined();
      expect(track.metadata.sunoPrompt.length).toBeGreaterThanOrEqual(50);
      expect(track.metadata.sunoPrompt.includes(track.vertente)).toBe(true);
      expect(track.metadata.sunoPrompt.includes(`${track.bpm} BPM`)).toBe(true);
    }
  });

  test('determinism: same seed → same match groove output (rule 7)', async () => {
    const result1 = await AudioGenerator.generate({ matchDynamics: { seed: 12345 } });
    const result2 = await AudioGenerator.generate({ matchDynamics: { seed: 12345 } });
    // Compare match groove IDs and BPMs
    const grooves1 = result1.generated.tracks.filter(t => t.metadata.context === 'match');
    const grooves2 = result2.generated.tracks.filter(t => t.metadata.context === 'match');
    expect(grooves1.length).toBe(grooves2.length);
    for (let i = 0; i < grooves1.length; i++) {
      expect(grooves1[i].bpm).toBe(grooves2[i].bpm);
    }
  });

  test('manifest: category sum = 72 (rule 8)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    const m = result.generated.manifest.categories;
    const sum = m.context + m.preMatch + m.match + m.postMatch + m.narrative + m.admin;
    expect(sum).toBe(72);
  });

  test('forbidden: no WAV corruption (forbidden 1)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    for (const track of result.generated.tracks) {
      const wav = fs.readFileSync(`public/audio/${track.filename}`);
      expect(wav.length).toBeGreaterThan(0);
    }
  });

  test('forbidden: no duplicate filenames (forbidden 2)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    const filenames = result.generated.tracks.map(t => t.filename);
    const unique = new Set(filenames);
    expect(filenames.length).toBe(unique.size);
  });

  test('forbidden: suno prompts valid (forbidden 3)', async () => {
    const result = await AudioGenerator.generate({ dryRun: false });
    for (const track of result.generated.tracks) {
      const prompt = track.metadata.sunoPrompt;
      expect(prompt).not.toBeNull();
      expect(prompt.length).toBeGreaterThan(30);
      expect(prompt.toLowerCase()).toContain('bpm');
      expect(prompt.toLowerCase()).toContain('house');
    }
  });
});
```

---

## Harness (CI/CD)

### `.github/workflows/audio-generation.yml`
```yaml
name: Generate Audio Tracks

on:
  push:
    branches: [main]
    paths: ['scripts/generate-audio.js', 'src/audio/**']
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm install
      - run: npm run generate:audio
      
      - name: Validate audio manifest
        run: node scripts/validate-audio.js
      
      - name: Run audio tests
        run: npm run test:audio
      
      - name: Commit audio files
        run: |
          git add public/audio/
          git commit -m "chore: regenerate audio tracks ($(date))" || echo "No changes"
          git push
```

### `scripts/validate-audio.js`
```javascript
const manifest = require('../public/audio/metadata.json');

if (manifest.generated.tracks.length < 72) {
  throw new Error(`Only ${manifest.generated.tracks.length} tracks, need 72+`);
}

if (!manifest.validation.passed) {
  throw new Error(`Validation failed:\n${manifest.validation.errors.join('\n')}`);
}

console.log(`✅ Audio manifest valid: ${manifest.generated.tracks.length} tracks`);
```

---

## Checklist pre-spec approval

- [ ] O que é: claro (geração 72+ trilhas 16-bit SNES house)
- [ ] Input: tipado e completo
- [ ] Output: tipado + exemplo concreto
- [ ] Validação: 8+ regras (checkbox)
- [ ] Forbidden: 5+ casos (checkbox)
- [ ] Implementação: arquivos e CLI específicos
- [ ] Testes: 10+ casos
- [ ] Harness: CI/CD + validação
- [ ] Determinismo: match grooves reproduzíveis, context fixos

---

**Status**: Pronto para aprovação Dudu

**Próximos passos**:
1. Dudu aprova SPEC-050
2. Implementar `AudioGenerator.js` (Tone.js synthesis)
3. Implementar `MidiBuilder.js`
4. Implementar `SunoPromptGenerator.js`
5. Rodar harness (gera 72 faixas)
6. Deploy `public/audio/` + metadata.json
7. PR com todas validações passando
