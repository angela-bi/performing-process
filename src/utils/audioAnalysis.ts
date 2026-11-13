export function rms(waveform: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < waveform.length; i++) {
    const v = (waveform[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / waveform.length);
}

export function averageLevel(spectrum: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < spectrum.length; i++) sum += spectrum[i];
  return sum / spectrum.length / 255;
}

const hzToBin = (hz: number, len: number, sr: number) => Math.round((hz * len * 2) / sr);
export const binToHz = (bin: number, len: number, sr: number) => (bin * sr) / (len * 2);

export function bandLevel(spectrum: Uint8Array, sr: number, lowHz: number, highHz: number): number {
  const lo = Math.max(0, hzToBin(lowHz, spectrum.length, sr));
  const hi = Math.min(spectrum.length - 1, hzToBin(highHz, spectrum.length, sr));
  if (hi < lo) return 0;
  let sum = 0;
  for (let i = lo; i <= hi; i++) sum += spectrum[i];
  return sum / (hi - lo + 1) / 255;
}

export function peakFrequency(spectrum: Uint8Array, sr: number): number {
  let best = 0;
  for (let i = 1; i < spectrum.length; i++) if (spectrum[i] > spectrum[best]) best = i;
  return binToHz(best, spectrum.length, sr);
}

export function spectralCentroid(spectrum: Uint8Array, sr: number): number {
  let weighted = 0, total = 0;
  for (let i = 0; i < spectrum.length; i++) {
    weighted += binToHz(i, spectrum.length, sr) * spectrum[i];
    total += spectrum[i];
  }
  return total === 0 ? 0 : weighted / total;
}