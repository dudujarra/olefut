/**
 * HiHats909.js
 * TR-909 hi-hats per manual seção 2.4.
 *
 * Noise → bandpass 8kHz Q=0.8 → highshelf +6dB @ 6kHz → env.
 * Closed: decay 0.04. Open: decay 0.4.
 * Choke: metalEnv.cancel(time) antes de retrigger.
 */

export class HiHats909 {
  constructor(Tone, destination) {
    this.Tone = Tone;
    this.out = new Tone.Gain(0.5);

    this.noise = new Tone.Noise('white').start();
    this.bandpass = new Tone.Filter({
      type: 'bandpass',
      frequency: 8000,
      Q: 0.8,
    });
    this.highshelf = new Tone.Filter({
      type: 'highshelf',
      frequency: 6000,
      gain: 6,
    });
    this.metalEnv = new Tone.AmplitudeEnvelope({
      attack: 0.001,
      decay: 0.05,
      sustain: 0,
      release: 0.02,
    });

    this.noise.chain(this.bandpass, this.highshelf, this.metalEnv, this.out);

    if (destination) {
      this.out.connect(destination);
    }
  }

  /**
   * Closed hi-hat. Cancela qualquer release pendente (choke).
   */
  triggerClosed(time, velocity = 0.7) {
    this.metalEnv.cancel(time);
    this.metalEnv.triggerAttackRelease(0.04, time, velocity);
  }

  /**
   * Open hi-hat. Decay longo (0.4s).
   */
  triggerOpen(time, velocity = 0.8) {
    this.metalEnv.cancel(time);
    this.metalEnv.triggerAttackRelease(0.4, time, velocity);
  }

  connect(node) {
    this.out.connect(node);
    return this;
  }

  dispose() {
    this.noise.dispose();
    this.bandpass.dispose();
    this.highshelf.dispose();
    this.metalEnv.dispose();
    this.out.dispose();
  }
}
