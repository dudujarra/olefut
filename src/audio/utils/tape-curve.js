/**
 * tape-curve.js
 * Custom WaveShaper curve for tape saturation per manual seção 2.9.
 * arctan compression — comportamento de tape.
 */

export function makeTapeCurve(drive, length = 4096) {
  const curve = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const x = (i / length) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
  }
  return curve;
}
