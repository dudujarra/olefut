# ELIFOOT Audio System

Hybrid Tone.js synthesis + pre-rendered stems architecture.

## 📋 Quick Start

### 1. Generate Metadata & Pre-render Stems

```bash
npm run render:stems
```

This:
- Runs `AudioGenerator` to create 172 track definitions (metadata.json)
- Uses `ToneOfflineRenderer` to batch pre-render stems via Tone.Offline()
- Saves WAV files to `public/audio/stems/`

Dry-run mode (preview without saving):
```bash
npm run render:stems:dry
```

### 2. Initialize Music in Game

```javascript
import { MusicDirector, eventBus, GameEvents } from '@/audio/index.js';
import * as Tone from 'tone';

// Boot MusicDirector
const music = new MusicDirector({ bpm: 120, eventBus });
await music.init(Tone);

// Load pre-rendered stems (AudioBuffer objects)
const metaRes = await fetch('/audio/metadata.json');
const { generated } = await metaRes.json();
const stemData = await loadStemsAsAudioBuffers(generated.tracks);
await music.loadStems(stemData);

// Start dashboard state
music.transitionTo('dashboard');
```

### 3. React to Game Events

```javascript
// Listen for game events
eventBus.on(GameEvents.GOAL_SCORED, (data) => {
  // MusicDirector handles this automatically
  // But you can add custom logic
  console.log('Goal scored:', data);
});

eventBus.on(GameEvents.GAME_PHASE_CHANGE, (data) => {
  // data.phase: 'preMatch' | 'live' | 'postMatch'
  // MusicDirector transitions FSM automatically
});

// Emit from game logic
import { emitGameEvent } from '@/audio/index.js';

emitGameEvent(GameEvents.GOAL_SCORED, {
  byPlayer: true,
  moment: Date.now()
});
```

### 4. Control Intensity via RTPC

```javascript
// Real-time parameter control: momentum, intensity, scoreDiff
music.updateRTPC(
  momentum = 0.7,  // 0-1, affects filter cutoff
  intensity = 0.8, // 0-1, affects master volume
  scoreDiff = 2    // -100 to +100
);
```

## 🏗️ Architecture

### Components

| Module | Purpose |
|--------|---------|
| **AudioGenerator** | Generates 172 track metadata definitions (Node.js) |
| **ToneOfflineRenderer** | Batch pre-render stems via Tone.Offline() (browser) |
| **ToneSynthesis** | Synth factories per-vertente (deep, tech, progressive, funky, ambient) |
| **MusicDirector** | Runtime FSM + RTPC + stem mixing (browser) |
| **EventBus** | Pub-sub event system (jogo → música) |
| **MidiBuilder** | Procedural MIDI generation (metadata only) |
| **SunoPromptGenerator** | Legacy: Suno API prompts (kept for reference) |

### Data Flow

```
AudioGenerator (metadata.json)
  ↓
ToneOfflineRenderer (offline.html via Puppeteer)
  ↓
WAV stems (public/audio/stems/)
  ↓
MusicDirector (loads stems as Tone.Players)
  ↓
Game events (EventBus)
  ↓
FSM transitions + RTPC updates
  ↓
Tone.js playback with crossfades
```

## 🎼 Vertentes (Music Styles)

| Style | BPM | Character | Synths |
|-------|-----|-----------|--------|
| **Deep** | 115 | Warm, introspective | Fat sawtooth bass, triangle pad |
| **Tech** | 128 | Industrial, tight | Square bass, sawtooth stabs |
| **Progressive** | 122 | Building, epic | Layered pads, sine bass |
| **Funky** | 124 | Groovy, Brazilian | Bouncy bass, latin percussion |
| **Ambient** | 105 | Atmospheric, sparse | Long pads, minimal drums |

## 🎛️ FSM States

```
┌─────────┐  preMatch  ┌────────┐  start  ┌──────┐  end  ┌──────────┐
│Dashboard├───────────→│PreMatch├────────→│ Live ├──────→│PostMatch │
└─────────┘            └────────┘         └──────┘       └──────────┘
```

- **Dashboard**: Menu context (4 pre-rendered tracks)
- **PreMatch**: Formation + stadium entry (2 tracks)
- **Live**: Match gameplay (150 tracks = 50 grooves × 3 phases)
- **PostMatch**: Victory/defeat/draw reactions (9 tracks)

## 🎚️ RTPC Mapping

```javascript
// Real-time parameter control
momentum (0-1)  → filter cutoff (3000-5000 Hz)
intensity (0-1) → master volume (0.5-1.0)
scoreDiff (-100 to +100) → stem selection/dynamics
```

## 📊 Test Suite

All 16 audio tests passing:
```bash
npm run test:audio
```

Tests validate:
- 172+ track generation
- Category counts (context:4, preMatch:2, match:150, postMatch:9, narrative:6, admin:1)
- Vertente distribution
- Metadata completeness
- MIDI validity
- BPM ranges per vertente

## 🔧 Advanced: Custom Master Chain

Edit `ToneSynthesis.setupMasterChain()`:

```javascript
// Default: Reverb → Compressor → Limiter
// Can add: EQ3, MultibandCompressor, Tape saturation, etc.

this.effects.eq = new Tone.EQ3({
  low: 0,
  mid: 0,
  high: 0
}).connect(this.effects.reverb);
```

## 🚀 Performance Notes

- **Voice pooling**: Max ~6 polyphonic voices per synth (Tone.PolySynth limit)
- **Sample rate**: 44.1 kHz (standard, no upsampling)
- **Crossfade duration**: 2 seconds (quantized to bar boundary)
- **RTPC update rate**: ~60 Hz (tied to game loop)
- **Memory**: ~500MB for 172 pre-rendered stems (WAV format)

## 🐛 Common Issues

**Problem**: Stems not loading
```
Solution: Check public/audio/stems/ exists and WAV files are there
Run: npm run render:stems
```

**Problem**: FSM not transitioning
```
Solution: Emit GameEvents.GAME_PHASE_CHANGE with phase payload
Example: emitGameEvent(GameEvents.GAME_PHASE_CHANGE, { phase: 'live' })
```

**Problem**: RTPC not affecting music
```
Solution: Call music.updateRTPC() from game loop, not just once
Example: requestAnimationFrame(() => music.updateRTPC(...))
```

## 📚 References

- Tone.js docs: https://tonejs.org
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- OfflineAudioContext: https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext

## 🎛️ Next Steps

1. Implement offline-renderer.html fully (Puppeteer integration)
2. Add more stinger sounds (goal, card, whistle)
3. Implement drum fill generators (Markov chain patterns)
4. Add Brazilian percussion sampler
5. Dynamic master chain EQ based on scoreDiff
