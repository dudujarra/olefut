# 🎵 Audio System Test Guide

Quick start: render 4 test stems, listen, integrate.

## Step 1: Render Test Stems (30s each)

```bash
npm run render:test
```

Generates:
- `test_deep.wav` (115 BPM, warm introspective)
- `test_tech.wav` (128 BPM, industrial tight)
- `test_progressive.wav` (122 BPM, epic building)
- `test_funky.wav` (124 BPM, groovy celebration)

Output: `public/audio/test-stems/`

**Time:** ~2-3 min (Puppeteer headless rendering)

---

## Step 2: Listen

Open browser devtools console, load a stem:

```javascript
// Load test stem
const res = await fetch('/audio/test-stems/test_deep.wav');
const buffer = await res.arrayBuffer();

// Play via Tone.js
import * as Tone from 'tone';
const audioBuffer = await Tone.getContext().decodeAudioData(buffer);
const player = new Tone.Player(audioBuffer).toDestination();
player.start();
```

Or copy WAV to desktop, play in Audacity/iTunes.

---

## Step 3: Verify Sound Quality

Listen for:

### Deep House (test_deep.wav)
- ✅ Warm, introspective vibe
- ✅ Fat sawtooth bass (kick on 1,3,5,7)
- ✅ Triangle pad swelling gently
- ✅ Minimal percussion

### Tech House (test_tech.wav)
- ✅ Industrial, tight tight
- ✅ Sine kick (every 8th note)
- ✅ Square bass driving
- ✅ Sawtooth stabs (percussive)

### Progressive House (test_progressive.wav)
- ✅ Building, epic crescendo
- ✅ Minimal bass (sustained C2)
- ✅ Swelling pads (layered)
- ✅ Melody rising (last third)

### Funky House (test_funky.wav)
- ✅ Groovy, syncopated
- ✅ Bouncy square bass (6-note pattern)
- ✅ Square melody (retro)
- ✅ Rhythmic hi-hats

---

## Step 4: Integrate into Game

Copy test stems OR run full render:

### Option A: Use test stems for dev

```javascript
import { MusicDirector, eventBus } from '@/audio/index.js';

const music = new MusicDirector({ bpm: 120 });
await music.init(Tone);

// Load test stems instead of full 172
const testStemPaths = [
  '/audio/test-stems/test_deep.wav',
  '/audio/test-stems/test_tech.wav',
  '/audio/test-stems/test_progressive.wav',
  '/audio/test-stems/test_funky.wav'
];

const stemData = await Promise.all(
  testStemPaths.map(async path => {
    const res = await fetch(path);
    const buffer = await res.arrayBuffer();
    const audioBuffer = await Tone.getContext().decodeAudioData(buffer);
    return { id: path.split('/').pop(), buffer, duration: 30 };
  })
);

await music.loadStems(stemData);
music.transitionTo('live');
```

### Option B: Run full render (all 172 stems)

```bash
npm run render:stems
```

Takes ~8-12 hours. Pre-compile once, ship.

---

## Step 5: Test Events

Emit game events from console:

```javascript
import { eventBus, GameEvents } from '@/audio/index.js';

// Goal scored
eventBus.emit(GameEvents.GOAL_SCORED, { byPlayer: true });

// Card issued
eventBus.emit(GameEvents.CARD_ISSUED, { color: 'yellow' });

// Phase change
eventBus.emit(GameEvents.GAME_PHASE_CHANGE, { phase: 'live' });

// Match ended
eventBus.emit(GameEvents.MATCH_ENDED, { result: 'victory' });
```

MusicDirector reacts:
- Stingers play (if initialized)
- FSM transitions
- RTPC updates dynamically

---

## Troubleshooting

**"Stinger not found"**
→ SingerGenerator not initialized yet. Wait for boot or remove await.

**"Stems not loading"**
→ Check public/audio/test-stems/ exists
→ Run `npm run render:test` first

**"No sound"**
→ Check master volume (MusicDirector.masterGain)
→ Verify Tone.start() called
→ Check browser audio is unmuted

**Puppeteer timeout**
→ Increase timeout in test-render.js (line ~40)
→ Or run render:stems:dry (metadata only, no sound)

---

## Architecture Checklist

- [ ] npm run render:test succeeds
- [ ] 4 WAV files in public/audio/test-stems/
- [ ] Listen: each stem distinct & high quality
- [ ] MusicDirector loads stems without error
- [ ] EventBus emits & music reacts
- [ ] RTPC updates filter/volume
- [ ] Dynamic EQ changes tone by scoreDiff

---

## Next: Full Render

Once test passes:

```bash
npm run render:stems
# Wait 8-12 hours...
# 172 stems + 11 stingers pre-rendered in public/audio/stems/
```

Then integrate into game loop permanently.

---

## Files Generated

```
public/audio/
├── test-stems/
│   ├── test_deep.wav
│   ├── test_tech.wav
│   ├── test_progressive.wav
│   └── test_funky.wav
└── stems/ (after full render)
    ├── context_start_menu.wav
    ├── match_base_00_phase1.wav
    ├── stinger_goal.wav
    └── ... (172 total)
```

---

## Performance Notes

- Each test stem: 30 seconds, ~2.6 MB WAV (uncompressed)
- Full render: 172 stems × 2-3 min avg = ~8-12 hours
- Runtime CPU: 1-2% playback (Tone.Player is light)
- Memory: ~500 MB loaded stems (browsers cache)

---

## Enjoy! 🎵

Lemme know results. Anything weird, we tweak.
